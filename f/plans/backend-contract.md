# 后端接口契约文档

## 1. 认证 (Authentication)

### 1.1. 用户注册 (User Registration)

- **URL:** `/auth/register`
- **方法:** `POST`
- **请求体:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword123",
    "confirmPassword": "yourpassword123"
  }
  ```
- **响应:**
  - **成功 (201 Created):**
    ```json
    {
      "message": "Registration successful",
      "userId": "uuid-of-user"
    }
    ```
  - **失败 (400 Bad Request):**
    ```json
    {
      "error": "Email already exists or passwords do not match"
    }
    ```

### 1.2. 用户登录 (User Login)

- **URL:** `/auth/login`
- **方法:** `POST`
- **请求体:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword123"
  }
  ```
- **响应:**
  - **成功 (200 OK):**
    ```json
    {
      "message": "Login successful",
      "token": "jwt-token-string",
      "userId": "uuid-of-user"
    }
    ```
  - **失败 (401 Unauthorized):**
    ```json
    {
      "error": "Invalid credentials"
    }
    ```

## 2. 会话页面 (Chat Page)

### 2.1. 发送消息 (Send Message)

- **URL:** `/chat/message`
- **方法:** `POST`
- **认证:** 需要 `Bearer Token`
- **请求体:**
  ```json
  {
    "content": "Hello, how are you?"
  }
  ```
- **响应:**
  - **成功 (200 OK):**
    ```json
    {
      "messageId": "uuid-of-message",
      "timestamp": "ISO-8601-datetime"
    }
    ```
  - **失败 (401 Unauthorized, 400 Bad Request 等):**
    ```json
    {
      "error": "Error details"
    }
    ```

### 2.2. 获取消息历史 (Get Message History)

- **URL:** `/chat/history`
- **方法:** `GET`
- **认证:** 需要 `Bearer Token`
- **查询参数:**
  - `limit`: （可选）消息数量限制，默认值 50
  - `offset`: （可选）偏移量，用于分页，默认值 0
- **响应:**
  - **成功 (200 OK):**
    ```json
    {
      "messages": [
        {
          "messageId": "uuid-1",
          "sender": "user",
          "content": "Hello",
          "timestamp": "ISO-8601-datetime-1"
        },
        {
          "messageId": "uuid-2",
          "sender": "ai",
          "content": "Hi there!",
          "timestamp": "ISO-8601-datetime-2"
        }
      ],
      "total": 2
    }
    ```

### 2.3. 提交回答 (Submit Answer)

- **URL:** `/answer/submit`
- **方法:** `POST`
- **认证:** 需要 `Bearer Token`
- **请求体:**
  ```json
  {
    "questionId": "uuid-of-question",
    "answerContent": "Your answer to the question."
  }
  ```
- **响应:**
  - **成功 (200 OK):**
    ```json
    {
      "message": "Answer submitted successfully",
      "answerId": "uuid-of-answer",
      "timestamp": "ISO-8601-datetime"
    }
    ```
  - **失败 (401 Unauthorized, 400 Bad Request 等):**
    ```json
    {
      "error": "Error details"
    }
    ```
