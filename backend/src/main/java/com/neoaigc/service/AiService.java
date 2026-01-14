package com.neoaigc.service;

/**
 * AI服务接口，定义通用的AI功能方法
 */
public interface AiService {
    
    /**
     * 文生图
     * @param prompt 提示词
     * @return 生成的图像URL
     */
    String textToImage(String prompt);
    
    /**
     * 图生图
     * @param imageUrl 原始图像URL
     * @param prompt 提示词
     * @return 生成的图像URL
     */
    String imageToImage(String imageUrl, String prompt);
    
    /**
     * 批量抠图
     * @param imageUrl 原始图像URL
     * @return 处理后的图像URL
     */
    String removeBackground(String imageUrl);
    
    /**
     * 人脸替换
     * @param imageUrl 原始图像URL
     * @param prompt 提示词
     * @return 处理后的图像URL
     */
    String faceSwap(String imageUrl, String prompt);
}