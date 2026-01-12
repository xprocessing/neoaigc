package com.neoaigc.mapper;

import com.neoaigc.entity.User;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户Mapper接口
 */
@Mapper
public interface UserMapper {
    
    User findByOpenId(String openId);
    
    int insert(User user);
    
    int update(User user);
    
    User findById(Long id);
}
