package com.neoaigc.controller;

import com.neoaigc.entity.AiTask;
import com.neoaigc.mapper.AiTaskMapper;
import com.neoaigc.service.HunyuanAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AI任务控制器
 */
@RestController
@RequestMapping("/task")
@CrossOrigin(origins = "*")
public class TaskController {

    @Autowired
    private AiTaskMapper taskMapper;

    @Autowired
    private HunyuanAiService hunyuanAiService;

    @Value("${file.upload-path}")
    private String uploadPath;

    /**
     * 创建任务
     */
    @PostMapping("/create")
    public Map<String, Object> createTask(
            @RequestParam("type") String type,
            @RequestParam("prompt") String prompt,
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Unauthorized");
            return result;
        }

        try {
            // 处理文件上传
            String imageUrl = null;
            if (file != null && !file.isEmpty()) {
                imageUrl = uploadFile(file);
            }

            // 创建任务
            AiTask task = new AiTask();
            task.setUserId(userId);
            task.setType(AiTask.TaskType.valueOf(type));
            task.setPrompt(prompt);
            task.setImageUrl(imageUrl);
            task.setStatus(AiTask.TaskStatus.PENDING);
            taskMapper.insert(task);

            // 异步执行任务
            executeTask(task);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("taskId", task.getId());
            result.put("message", "Task created successfully");
            return result;

        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Failed to create task: " + e.getMessage());
            return result;
        }
    }

    /**
     * 获取任务详情
     */
    @GetMapping("/{id}")
    public Map<String, Object> getTask(@PathVariable Long id) {
        AiTask task = taskMapper.findById(id);
        
        Map<String, Object> result = new HashMap<>();
        if (task != null) {
            result.put("success", true);
            result.put("data", task);
        } else {
            result.put("success", false);
            result.put("message", "Task not found");
        }
        return result;
    }

    /**
     * 获取用户任务列表
     */
    @GetMapping("/list")
    public Map<String, Object> getUserTasks(
            @RequestParam(value = "type", required = false) String type,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Unauthorized");
            return result;
        }

        List<AiTask> tasks;
        if (type != null && !type.isEmpty()) {
            tasks = taskMapper.findByUserIdAndType(userId, AiTask.TaskType.valueOf(type));
        } else {
            tasks = taskMapper.findByUserId(userId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", tasks);
        result.put("total", tasks.size());
        return result;
    }

    /**
     * 上传文件
     */
    private String uploadFile(MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path path = Paths.get(uploadPath, fileName);
        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());
        return "/uploads/" + fileName;
    }

    /**
     * 异步执行任务
     */
    private void executeTask(AiTask task) {
        new Thread(() -> {
            try {
                // 更新状态为处理中
                task.setStatus(AiTask.TaskStatus.PROCESSING);
                taskMapper.update(task);

                // 调用AI服务
                String resultUrl = switch (task.getType()) {
                    case TEXT_TO_IMAGE -> hunyuanAiService.textToImage(task.getPrompt());
                    case IMAGE_TO_IMAGE -> hunyuanAiService.imageToImage(task.getImageUrl(), task.getPrompt());
                    case BATCH_MATTING -> hunyuanAiService.removeBackground(task.getImageUrl());
                    case FACE_SWAP -> hunyuanAiService.faceSwap(task.getImageUrl(), task.getPrompt());
                };

                // 更新结果
                task.setResultUrl(resultUrl);
                task.setStatus(AiTask.TaskStatus.COMPLETED);
                taskMapper.update(task);

            } catch (Exception e) {
                task.setStatus(AiTask.TaskStatus.FAILED);
                task.setErrorMessage(e.getMessage());
                taskMapper.update(task);
            }
        }).start();
    }
}
