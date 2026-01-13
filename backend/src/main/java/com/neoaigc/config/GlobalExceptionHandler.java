package com.neoaigc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理IO异常
     */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Map<String, Object>> handleIOException(IOException ex) {
        logger.error("IO异常: {}", ex.getMessage(), ex);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "文件处理错误: " + ex.getMessage());
        
        return new ResponseEntity<>(result, HttpStatus.BAD_REQUEST);
    }

    /**
     * 处理文件大小超过限制异常
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        logger.error("文件大小超过限制: {}", ex.getMessage(), ex);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "文件大小超过限制，请上传小于50MB的文件");
        
        return new ResponseEntity<>(result, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    /**
     * 处理404异常
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFoundException(NoHandlerFoundException ex) {
        logger.error("404错误: {}", ex.getMessage(), ex);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "请求的资源不存在");
        
        return new ResponseEntity<>(result, HttpStatus.NOT_FOUND);
    }

    /**
     * 处理通用异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        logger.error("系统异常: {}", ex.getMessage(), ex);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "系统错误，请稍后重试");
        
        return new ResponseEntity<>(result, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}