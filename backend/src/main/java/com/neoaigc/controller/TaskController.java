package com.neoaigc.controller;

import com.neoaigc.entity.AiTask;
import com.neoaigc.mapper.AiTaskMapper;
import com.neoaigc.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private AiTaskMapper taskMapper;

    @Autowired
    private AiService aiService; // 默认AI服务
    
    @Autowired
    private AiService tencentAiService; // 腾讯混元AI服务
    
    @Autowired
    private AiService aliyunAiService; // 阿里云百炼AI服务

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
            @RequestParam(value = "provider", defaultValue = "tencent") String provider,
            HttpServletRequest request) {

        logger.info("接收到创建任务请求，类型: {}, 用户: {}", type, request.getAttribute("userId"));

        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            logger.warn("创建任务失败: 未授权用户");
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Unauthorized");
            return result;
        }

        try {
            // 处理文件上传
            String imageUrl = null;
            if (file != null && !file.isEmpty()) {
                logger.info("开始上传文件，原始文件名: {}", file.getOriginalFilename());
                imageUrl = uploadFile(file);
                logger.info("文件上传成功，保存路径: {}", imageUrl);
            }

            // 创建任务
            AiTask task = new AiTask();
            task.setUserId(userId);
            task.setType(AiTask.TaskType.valueOf(type));
            task.setPrompt(prompt);
            task.setImageUrl(imageUrl);
            task.setProvider(provider); // 设置AI服务提供商
            task.setStatus(AiTask.TaskStatus.PENDING);
            taskMapper.insert(task);

            // 异步执行任务
            executeTask(task);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("taskId", task.getId());
            result.put("message", "Task created successfully");
            logger.info("任务创建成功，任务ID: {}", task.getId());
            return result;

        } catch (Exception e) {
            logger.error("创建任务失败: {}", e.getMessage(), e);
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
        // 验证文件大小
        long maxSize = 50 * 1024 * 1024; // 50MB
        if (file.getSize() > maxSize) {
            throw new IOException("File size exceeds the limit of 50MB");
        }
        
        // 验证文件类型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Only image files are allowed");
        }
        
        // 获取文件扩展名
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        
        // 生成唯一文件名
        String fileName = UUID.randomUUID().toString() + fileExtension;
        
        // 创建上传目录
        Path uploadDirPath = Paths.get(uploadPath);
        Files.createDirectories(uploadDirPath);
        
        // 保存文件
        Path filePath = uploadDirPath.resolve(fileName);
        Files.write(filePath, file.getBytes());
        
        // 返回相对路径
        return "/uploads/" + fileName;
    }

    /**
     * 异步执行任务
     */
    @org.springframework.scheduling.annotation.Async("taskExecutor")
    public void executeTask(AiTask task) {
        try {
            // 更新状态为处理中
            task.setStatus(AiTask.TaskStatus.PROCESSING);
            taskMapper.update(task);

            // 根据用户选择的AI服务提供商选择对应的服务
            AiService selectedAiService = aiService; // 默认服务
            if ("aliyun".equals(task.getProvider())) {
                selectedAiService = aliyunAiService;
            } else if ("tencent".equals(task.getProvider())) {
                selectedAiService = tencentAiService;
            }

            // 调用AI服务
            String resultUrl = switch (task.getType()) {
                case TEXT_TO_IMAGE -> selectedAiService.textToImage(task.getPrompt());
                case IMAGE_TO_IMAGE -> selectedAiService.imageToImage(task.getImageUrl(), task.getPrompt());
                case BATCH_MATTING -> selectedAiService.removeBackground(task.getImageUrl());
                case FACE_SWAP -> selectedAiService.faceSwap(task.getImageUrl(), task.getPrompt());
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
    }
}
