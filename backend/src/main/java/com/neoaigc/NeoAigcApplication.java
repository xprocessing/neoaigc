package com.neoaigc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

/**
 * NeoAI GC 主应用类
 * AI图片视频生成平台后端服务
 */
@SpringBootApplication
@MapperScan("com.neoaigc.mapper")
public class NeoAigcApplication {

    public static void main(String[] args) {
        SpringApplication.run(NeoAigcApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("NeoAI GC 后端服务启动成功！");
        System.out.println("访问地址: http://localhost:8080/api");
        System.out.println("========================================\n");
    }
}
