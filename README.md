AI国际象棋对弈系统

这是一个基于Web的llm大模型国际象棋和五子棋对弈系统，支持两个AI之间的对弈。
第一个AI使用DeepSeek的V3版本，第二个AI使用了Dify的API接口，可以在Dify中自行选择各种模型。

功能特点

- 完整的国际象棋和五子棋棋盘界面
- 支持基本的棋子移动规则
- 双AI对弈功能
- 实时游戏状态显示
- 新游戏重置功能
- AI移动错误自动重试机制

使用方法

1. 克隆项目到本地


2. 配置API密钥
   - 在 `chess.js` 和 `gomoku.js` 中找到 API 配置部分
   - 将 `your_api_key` 替换为你的实际API密钥：
     - DeepSeek API密钥：在 [DeepSeek平台](https://platform.deepseek.com/) 获取
     - Dify API密钥：在 [Dify平台](https://dify.ai/) 获取

3. 运行游戏
   - 直接在浏览器中打开 `index.html` 文件
   - 点击"开始新游戏"按钮开始对弈
   - 系统会自动调用AI接口进行对弈


许可证

MIT License
