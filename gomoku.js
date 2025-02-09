class GomokuGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'black';
        this.gameActive = false;
        this.isAIThinking = false;
        
        // AI配置
        this.deepseekConfig = {
            baseUrl: 'https://api.deepseek.com',
            apiKey: 'your_api_key'
        };
        

        this.difyConfig = {
            baseUrl: 'https://api.dify.ai/v1',
            apiKey: 'your_api_key'
        };
        
        this.initializeBoard();
    }

    startNewGame() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'black';
        this.gameActive = true;
        this.isAIThinking = false;
        this.initializeBoard();
        document.getElementById('gameStatus').textContent = '游戏状态: 黑方回合';
        document.getElementById('thinking').style.display = 'none';
        
        // 开始AI对弈
        setTimeout(() => this.makeAIMove(), 1000);
    }

    createInitialBoard() {
        return Array(15).fill(null).map(() => Array(15).fill(null));
    }

    initializeBoard() {
        const board = document.getElementById('gomokuboard');
        board.innerHTML = '';

        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const cell = document.createElement('div');
                cell.className = 'gomoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = `gomoku-piece ${this.board[row][col]}`;
                    cell.appendChild(piece);
                }

                board.appendChild(cell);
            }
        }
    }

    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]],  // 水平
            [[1, 0], [-1, 0]],  // 垂直
            [[1, 1], [-1, -1]], // 对角线
            [[1, -1], [-1, 1]]  // 反对角线
        ];

        const color = this.board[row][col];
        if (!color) return false;

        for (const direction of directions) {
            let count = 1;
            
            for (const [dx, dy] of direction) {
                let r = row + dx;
                let c = col + dy;
                while (
                    r >= 0 && r < 15 && 
                    c >= 0 && c < 15 && 
                    this.board[r][c] === color
                ) {
                    count++;
                    r += dx;
                    c += dy;
                }
            }

            if (count >= 5) return true;
        }

        return false;
    }

    async makeAIMove() {
        if (this.isAIThinking || !this.gameActive) return;
        this.isAIThinking = true;
        
        document.getElementById('thinking').style.display = 'block';
        document.getElementById('gameStatus').textContent = 
            `游戏状态: ${this.currentPlayer === 'black' ? '黑' : '白'}方思考中...`;
        
        let retryCount = 0;
        const maxRetries = 5;
        let lastError = null;
        
        while (retryCount < maxRetries) {
            try {
                const moveStr = await (this.currentPlayer === 'black' 
                    ? this.callDeepseekAI(this.board, lastError)
                    : this.callDifyAI(this.board, lastError));
                
                if (!moveStr) {
                    lastError = 'AI返回空移动';
                    throw new Error(lastError);
                }
                
                console.log(`五子棋AI返回的原始移动: ${moveStr}`);
                
                const [row, col] = moveStr.split(',').map(n => parseInt(n.trim()));
                
                if (isNaN(row) || isNaN(col) || 
                    row < 0 || row >= 15 || 
                    col < 0 || col >= 15) {
                    lastError = `无效的坐标: ${row},${col}`;
                    throw new Error(lastError);
                }
                
                if (this.board[row][col]) {
                    lastError = `位置已被占用: ${row},${col}`;
                    throw new Error(lastError);
                }
                
                // 落子
                this.board[row][col] = this.currentPlayer;
                console.log(`${this.currentPlayer}方落子: ${row},${col}`);
                
                // 检查胜负
                if (this.checkWin(row, col)) {
                    this.gameActive = false;
                    document.getElementById('gameStatus').textContent = 
                        `游戏结束: ${this.currentPlayer === 'black' ? '黑' : '白'}方胜利！`;
                    this.isAIThinking = false;
                    document.getElementById('thinking').style.display = 'none';
                    this.initializeBoard();
                    return;
                }
                
                // 检查平局
                if (this.board.every(row => row.every(cell => cell !== null))) {
                    this.gameActive = false;
                    document.getElementById('gameStatus').textContent = '游戏结束: 平局！';
                    this.isAIThinking = false;
                    document.getElementById('thinking').style.display = 'none';
                    return;
                }
                
                this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
                document.getElementById('gameStatus').textContent = 
                    `游戏状态: ${this.currentPlayer === 'black' ? '黑' : '白'}方回合`;
                this.initializeBoard();
                
                // 重置状态
                this.isAIThinking = false;
                document.getElementById('thinking').style.display = 'none';
                
                // 延迟触发下一个AI的移动
                setTimeout(() => this.makeAIMove(), 1000);
                return;
                
            } catch (error) {
                console.error(`五子棋AI移动出错 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    console.error('AI移动失败次数过多，游戏结束');
                    this.gameActive = false;
                    document.getElementById('gameStatus').textContent = 
                        `游戏结束: ${this.currentPlayer === 'black' ? '黑' : '白'}方移动失败`;
                    this.isAIThinking = false;
                    document.getElementById('thinking').style.display = 'none';
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async callDeepseekAI(boardState, lastError = null) {
        const systemMessage = `你是一个五子棋AI。请仔细理解以下规则：

1. 棋盘布局：
   - 棋盘是15x15的，坐标从0开始
   - 行号从上到下是0-14
   - 列号从左到右是0-14
   - 黑子先行，白子后行
   - null表示空位，'black'表示黑子，'white'表示白子

2. 移动规则：
   - 只能在空位落子
   - 五子连珠（横、竖、斜）即胜

3. 返回格式：
   - 严格按照"行号,列号"格式
   - 只能包含2个数字和1个逗号
   - 不要加任何其他字符或说明

示例：要在第8行第7列落子，应该返回：8,7`;

        const userMessage = lastError 
            ? `上一次移动出错：${lastError}

当前棋盘状态：
${JSON.stringify(boardState, null, 2)}

请重新思考并给出一个合法的黑方落子位置。记住：
1. 确保选择的位置为空(null)
2. 坐标范围在0-14之间
3. 只返回两个数字，用逗号分隔`
            : `当前棋盘状态：
${JSON.stringify(boardState, null, 2)}

请给出一个合法的黑方落子位置。只返回两个数字，用逗号分隔。`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(`${this.deepseekConfig.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.deepseekConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: systemMessage },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.1,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`DeepSeek API 请求失败: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
                throw new Error('DeepSeek API 返回数据格式错误');
            }

            const content = data.choices[0].message.content.trim();
            console.log('DeepSeek API 返回内容:', content);
            return content;

        } catch (error) {
            console.error('DeepSeek API 调用错误:', error);
            throw error;
        }
    }

    async callDifyAI(boardState, lastError = null) {
        const basePrompt = `这是一个五子棋游戏。请仔细理解以下规则：

1. 棋盘布局：
   - 棋盘是15x15的，坐标从0开始
   - 行号从上到下是0-14
   - 列号从左到右是0-14
   - 黑子先行，白子后行
   - null表示空位，'black'表示黑子，'white'表示白子

2. 移动规则：
   - 只能在空位落子
   - 五子连珠（横、竖、斜）即胜

3. 返回格式：
   - 严格按照"行号,列号"格式
   - 只能包含2个数字和1个逗号
   - 不要加任何其他字符或说明

当前棋盘状态：
${JSON.stringify(boardState, null, 2)}`;

        const errorFeedback = lastError 
            ? `\n\n上一次移动出错：${lastError}\n请重新思考并给出一个合法的白方落子位置。` 
            : '\n\n请给出一个合法的白方落子位置。';

        const response = await fetch(`${this.difyConfig.baseUrl}/chat-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.difyConfig.apiKey}`
            },
            body: JSON.stringify({
                inputs: {},
                query: basePrompt + errorFeedback,
                response_mode: "blocking",
                conversation_id: "",
                user: "gomoku_player",
                files: []
            })
        });

        if (!response.ok) {
            throw new Error(`Dify API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.answer) {
            throw new Error('Dify API 返回数据格式错误');
        }

        let answer = data.answer
            .replace(/```/g, '')
            .replace(/\n/g, '')
            .trim();

        const match = answer.match(/\d+,\d+/);
        if (!match) {
            throw new Error('无法从返回内容中提取有效的坐标');
        }

        return match[0];
    }
}