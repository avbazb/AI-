document.addEventListener('DOMContentLoaded', () => {
    let currentGame = null;
    let currentGameType = 'chess';
    
    // 初始化游戏
    function initGame(type) {
        // 清理旧游戏
        if (currentGame) {
            // 可以添加清理逻辑
        }
        
        // 创建新游戏
        if (type === 'chess') {
            currentGame = new ChessGame();
            document.getElementById('chessGame').classList.add('active');
            document.getElementById('gomokuGame').classList.remove('active');
        } else {
            currentGame = new GomokuGame();
            document.getElementById('gomokuGame').classList.add('active');
            document.getElementById('chessGame').classList.remove('active');
        }
        
        currentGameType = type;
        
        // 重置游戏状态
        document.getElementById('gameStatus').textContent = '游戏状态: 等待开始';
        document.getElementById('thinking').style.display = 'none';
    }
    
    // 游戏切换逻辑
    document.getElementById('chessSelector').addEventListener('click', () => {
        if (currentGameType !== 'chess') {
            document.getElementById('chessSelector').classList.add('active');
            document.getElementById('gomokuSelector').classList.remove('active');
            initGame('chess');
        }
    });
    
    document.getElementById('gomokuSelector').addEventListener('click', () => {
        if (currentGameType !== 'gomoku') {
            document.getElementById('gomokuSelector').classList.add('active');
            document.getElementById('chessSelector').classList.remove('active');
            initGame('gomoku');
        }
    });
    
    // 开始新游戏按钮
    document.getElementById('startGame').addEventListener('click', () => {
        if (currentGame) {
            if (currentGameType === 'chess') {
                currentGame.startNewGame();
            } else {
                currentGame.startNewGame();
            }
        }
    });
    
    // 初始化默认游戏（国际象棋）
    initGame('chess');
});