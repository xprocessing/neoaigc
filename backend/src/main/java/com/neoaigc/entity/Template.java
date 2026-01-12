package com.neoaigc.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 模板实体类
 */
@Data
public class Template {
    private Long id;
    private String name;
    private String description;
    private Integer type;  // 1-文生图 2-图生图 3-抠图 4-换脸
    private String prompt;
    private String previewImage;
    private Integer sort;
    private Integer status;
    private LocalDateTime createdAt;
}
