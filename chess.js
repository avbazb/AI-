class ChessGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
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
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.gameActive = true;
        this.isAIThinking = false;
        this.initializeBoard();
        document.getElementById('gameStatus').textContent = '游戏状态: 白方回合';
        document.getElementById('thinking').style.display = 'none';
        
        // 开始AI对弈
        setTimeout(() => this.makeAIMove(), 1000);
    }

    createInitialBoard() {
        return [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
    }

    initializeBoard() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                if (this.board[row][col]) {
                    const piece = document.createElement('div');
                    piece.className = 'piece';
                    piece.textContent = this.board[row][col];
                    piece.dataset.color = row < 2 ? 'black' : 'white';
                    square.appendChild(piece);
                }

                chessboard.appendChild(square);
            }
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        // 基本边界检查
        if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
            toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
            return false;
        }

        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];

        // 检查是否有棋子可以移动
        if (!piece) return false;

        // 检查目标位置是否是己方棋子
        const isSourceWhite = '♔♕♖♗♘♙'.includes(piece);
        const isTargetWhite = targetPiece && '♔♕♖♗♘♙'.includes(targetPiece);
        const isSourceBlack = '♚♛♜♝♞♟'.includes(piece);
        const isTargetBlack = targetPiece && '♚♛♜♝♞♟'.includes(targetPiece);

        if ((isSourceWhite && isTargetWhite) || (isSourceBlack && isTargetBlack)) {
            return false;
        }

        // 计算移动的距离
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        // 根据不同棋子类型验证移动
        switch (piece) {
            case '♔': case '♚': // 王
                return rowDiff <= 1 && colDiff <= 1;

            case '♕': case '♛': // 后
                return rowDiff === colDiff || rowDiff === 0 || colDiff === 0;

            case '♖': case '♜': // 车
                return rowDiff === 0 || colDiff === 0;

            case '♗': case '♝': // 象
                return rowDiff === colDiff;

            case '♘': case '♞': // 马
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

            case '♙': case '♟': // 兵
                const direction = piece === '♙' ? -1 : 1; // 白兵向上，黑兵向下
                const startRow = piece === '♙' ? 6 : 1;   // 起始行

                // 前进一步
                if (colDiff === 0 && !targetPiece) {
                    if (fromRow === startRow && toRow === fromRow + 2 * direction) {
                        return !this.board[fromRow + direction][fromCol]; // 确保中间无棋子
                    }
                    return toRow === fromRow + direction;
                }
                // 吃子
                if (colDiff === 1 && toRow === fromRow + direction && targetPiece) {
                    return true;
                }
                return false;
        }

        return false;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
    }

    checkWin() {
        // 检查是否有王被吃掉
        let whiteKing = false;
        let blackKing = false;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece === '♔') whiteKing = true;
                if (piece === '♚') blackKing = true;
            }
        }

        if (!whiteKing) return 'black';
        if (!blackKing) return 'white';
        return null;
    }

    async makeAIMove() {
        if (this.isAIThinking || !this.gameActive) return;
        this.isAIThinking = true;
        
        document.getElementById('thinking').style.display = 'block';
        document.getElementById('gameStatus').textContent = 
            `游戏状态: ${this.currentPlayer === 'white' ? '白' : '黑'}方思考中...`;
        
        let retryCount = 0;
        const maxRetries = 5;
        let lastError = null;
        
        while (retryCount < maxRetries) {
            try {
                const moveStr = await (this.currentPlayer === 'white' 
                    ? this.callDeepseekAI(this.board, lastError)
                    : this.callDifyAI(this.board, lastError));
                
                if (!moveStr) {
                    lastError = 'AI返回空移动';
                    throw new Error(lastError);
                }
                
                console.log(`国际象棋AI返回的原始移动: ${moveStr}`);
                
                const moves = moveStr.split(',').map(n => parseInt(n.trim()));
                if (moves.length !== 4 || moves.some(n => isNaN(n))) {
                    lastError = `返回格式错误: ${moveStr}`;
                    throw new Error(lastError);
                }
                
                const [fromRow, fromCol, toRow, toCol] = moves;
                
                // 验证坐标范围
                if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
                    toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
                    lastError = `坐标超出范围: ${fromRow},${fromCol} -> ${toRow},${toCol}`;
                    throw new Error(lastError);
                }
                
                // 验证移动的棋子颜色是否正确
                const piece = this.board[fromRow]?.[fromCol];
                const isWhitePiece = piece && '♔♕♖♗♘♙'.includes(piece);
                const isBlackPiece = piece && '♚♛♜♝♞♟'.includes(piece);
                
                if (!piece) {
                    lastError = `起始位置 ${fromRow},${fromCol} 没有棋子`;
                    throw new Error(lastError);
                }
                
                if ((this.currentPlayer === 'white' && !isWhitePiece) || 
                    (this.currentPlayer === 'black' && !isBlackPiece)) {
                    lastError = `选择了错误颜色的棋子: ${piece}`;
                    throw new Error(lastError);
                }
                
                if (this.isValidMove(fromRow, fromCol, toRow, toCol)) {
                    console.log(`${this.currentPlayer}方移动: ${fromRow},${fromCol} -> ${toRow},${toCol}`);
                    this.makeMove(fromRow, fromCol, toRow, toCol);
                    
                    // 检查胜负
                    const winner = this.checkWin();
                    if (winner) {
                        this.gameActive = false;
                        document.getElementById('gameStatus').textContent = 
                            `游戏结束: ${winner === 'white' ? '白' : '黑'}方胜利！`;
                        this.isAIThinking = false;
                        document.getElementById('thinking').style.display = 'none';
                        this.initializeBoard();
                        return;
                    }
                    
                    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
                    document.getElementById('gameStatus').textContent = 
                        `游戏状态: ${this.currentPlayer === 'white' ? '白' : '黑'}方回合`;
                    this.initializeBoard();
                    
                    // 重置状态
                    this.isAIThinking = false;
                    document.getElementById('thinking').style.display = 'none';
                    
                    // 延迟触发下一个AI的移动
                    setTimeout(() => this.makeAIMove(), 1000);
                    return;
                } else {
                    lastError = `无效的移动: ${fromRow},${fromCol} -> ${toRow},${toCol}`;
                    throw new Error(lastError);
                }
            } catch (error) {
                console.error(`国际象棋AI移动出错 (尝试 ${retryCount + 1}/${maxRetries}):`, error);
                retryCount++;
                
                if (retryCount === maxRetries) {
                    console.error('AI移动失败次数过多，游戏结束');
                    this.gameActive = false;
                    document.getElementById('gameStatus').textContent = 
                        `游戏结束: ${this.currentPlayer === 'white' ? '白' : '黑'}方移动失败`;
                    this.isAIThinking = false;
                    document.getElementById('thinking').style.display = 'none';
                    return;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async callDeepseekAI(boardState, lastError = null) {
        const systemMessage = `你是一个国际象棋AI。请仔细理解以下规则：

1. 棋盘布局：
   - 棋盘是8x8的，坐标从0开始
   - 行号从上到下是0-7
   - 列号从左到右是0-7
   - 白方(♔♕♖♗♘♙)在底部（第6-7行）
   - 黑方(♚♛♜♝♞♟)在顶部（第0-1行）

2. 移动规则：
   - 只能移动己方棋子
   - 起始位置必须有棋子
   - 移动必须符合国际象棋规则

3. 返回格式：
   - 严格按照"起始行,起始列,目标行,目标列"格式
   - 只能包含4个数字和3个逗号
   - 不要加任何其他字符或说明

示例：要移动底部白方的兵向前两格，应该返回：6,4,4,4`;

        const userMessage = lastError 
            ? `上一次移动出错：${lastError}

当前棋盘状态：
${JSON.stringify(boardState, null, 2)}

请重新思考并给出一个合法的白方移动。记住：
1. 确保起始位置（第一个坐标）有白方棋子
2. 确保移动合法
3. 只返回四个数字，用逗号分隔`
            : `当前棋盘状态：
${JSON.stringify(boardState, null, 2)}

请给出一个合法的白方移动。只返回四个数字，用逗号分隔。`;

        try {
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
                })
            });

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
        const basePrompt = `这是一个国际象棋游戏。请仔细理解以下规则：

1. 棋盘布局：
   - 棋盘是8x8的，坐标从0开始
   - 行号从上到下是0-7
   - 列号从左到右是0-7
   - 黑方(♚♛♜♝♞♟)在顶部（第0-1行）
   - 白方(♔♕♖♗♘♙)在底部（第6-7行）

2. 移动规则：
   - 只能移动黑方棋子
   - 起始位置必须有棋子
   - 移动必须符合国际象棋规则

3. 返回格式：
   - 严格按照"起始行,起始列,目标行,目标列"格式
   - 只能包含4个数字和3个逗号
   - 不要加任何其他字符或说明

当前棋盘状态：
${JSON.stringify(boardState, null, 2)}`;

        const errorFeedback = lastError 
            ? `\n\n上一次移动出错：${lastError}\n请重新思考并给出一个合法的黑方移动。` 
            : '\n\n请给出一个合法的黑方移动。';

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
                user: "chess_player",
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

        const match = answer.match(/\d+,\d+,\d+,\d+/);
        if (!match) {
            throw new Error('无法从返回内容中提取有效的移动坐标');
        }

        return match[0];
    }
}