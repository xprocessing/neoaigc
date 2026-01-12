package com.neoaigc.mapper;

import com.neoaigc.entity.Template;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * 模板Mapper接口
 */
@Mapper
public interface TemplateMapper {
    
    List<Template> findAll();
    
    List<Template> findByType(Integer type);
    
    Template findById(Long id);
}
