package com.neoaigc.controller;

import com.neoaigc.entity.User;
import com.neoaigc.mapper.UserMapper;
import com.neoaigc.security.JwtTokenProvider;
import com.neoaigc.util.HttpClientUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Value("${wechat.app-id}")
    private String appId;

    @Value("${wechat.app-secret}")
    private String appSecret;

    @Value("${wechat.qr-code-url}")
    private String qrCodeUrl;

    @Value("${wechat.redirect-uri}")
    private String redirectUri;

    /**
     * 获取微信登录二维码URL
     */
    @GetMapping("/wechat/qr-code")
    public Map<String, Object> getWeChatQrCode() {
        String url = String.format("%s?appid=%s&redirect_uri=%s&response_type=code&scope=snsapi_login&state=STATE#wechat_redirect",
                qrCodeUrl, appId, redirectUri);
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("qrCodeUrl", url);
        result.put("message", "QR code URL generated successfully");
        return result;
    }

    /**
     * 微信登录回调
     */
    @GetMapping("/wechat/callback")
    public Map<String, Object> weChatCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state) {

        try {
            // 1. 使用code获取access_token
            String tokenUrl = String.format(
                    "https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code",
                    appId, appSecret, code);
            
            String tokenResponse = HttpClientUtil.get(tokenUrl);
            JSONObject tokenJson = JSON.parseObject(tokenResponse);

            if (tokenJson.containsKey("errcode")) {
                throw new RuntimeException("WeChat auth error: " + tokenJson.getString("errmsg"));
            }

            String openId = tokenJson.getString("openid");
            String accessToken = tokenJson.getString("access_token");

            // 2. 获取用户信息
            String userInfoUrl = String.format(
                    "https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s",
                    accessToken, openId);
            
            String userInfoResponse = HttpClientUtil.get(userInfoUrl);
            JSONObject userInfo = JSON.parseObject(userInfoResponse);

            // 3. 查找或创建用户
            User user = userMapper.findByOpenId(openId);
            if (user == null) {
                user = new User();
                user.setOpenId(openId);
                user.setNickname(userInfo.getString("nickname"));
                user.setAvatar(userInfo.getString("headimgurl"));
                user.setBalance(100);
                userMapper.insert(user);
            } else {
                // 更新用户信息
                user.setNickname(userInfo.getString("nickname"));
                user.setAvatar(userInfo.getString("headimgurl"));
                userMapper.update(user);
            }

            // 4. 生成JWT Token
            String token = tokenProvider.generateToken(user.getId().toString());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("token", token);
            result.put("user", user);
            result.put("message", "Login successful");
            
            return result;

        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Login failed: " + e.getMessage());
            return result;
        }
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/user/info")
    public Map<String, Object> getUserInfo(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        
        if (userId == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Unauthorized");
            return result;
        }

        User user = userMapper.findById(Long.valueOf(userId));
        
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("user", user);
        return result;
    }
}
