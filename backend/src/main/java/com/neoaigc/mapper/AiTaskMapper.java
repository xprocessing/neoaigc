package com.neoaigc.mapper;

import com.neoaigc.entity.AiTask;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

/**
 * AI任务Mapper接口
 */
@Mapper
public interface AiTaskMapper {
    
    int insert(AiTask task);
    
    AiTask findById(Long id);
    
    int update(AiTask task);
    
    List<AiTask> findByUserId(String userId);
    
    List<AiTask> findByUserIdAndType(String userId, AiTask.TaskType type);
}
