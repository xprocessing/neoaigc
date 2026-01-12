package com.neoaigc.controller;

import com.neoaigc.entity.Template;
import com.neoaigc.mapper.TemplateMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 模板控制器
 */
@RestController
@RequestMapping("/template")
@CrossOrigin(origins = "*")
public class TemplateController {

    @Autowired
    private TemplateMapper templateMapper;

    /**
     * 获取所有模板
     */
    @GetMapping("/list")
    public Map<String, Object> getAllTemplates() {
        List<Template> templates = templateMapper.findAll();
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", templates);
        result.put("total", templates.size());
        return result;
    }

    /**
     * 根据类型获取模板
     */
    @GetMapping("/list/type/{type}")
    public Map<String, Object> getTemplatesByType(@PathVariable Integer type) {
        List<Template> templates = templateMapper.findByType(type);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", templates);
        result.put("total", templates.size());
        return result;
    }

    /**
     * 根据ID获取模板
     */
    @GetMapping("/{id}")
    public Map<String, Object> getTemplateById(@PathVariable Long id) {
        Template template = templateMapper.findById(id);
        
        Map<String, Object> result = new HashMap<>();
        if (template != null) {
            result.put("success", true);
            result.put("data", template);
        } else {
            result.put("success", false);
            result.put("message", "Template not found");
        }
        return result;
    }
}
