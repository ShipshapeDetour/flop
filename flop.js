const canvas = document.getElementById('canvas');
canvas.width = 400;
canvas.height = canvas.width * 11 / 8;
function resizeCanvas() {
    if (window.innerWidth / window.innerHeight <= canvas.width / canvas.height) {
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = '';
    } else {
        canvas.style.width = '';
        canvas.style.height = window.innerHeight + 'px';
        canvas.style.maxHeight = (window.innerHeight - 100) + 'px';
    }
}


const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highscoreDisplay = document.getElementById('highscore');
const restartButton = document.getElementById('restart');

let player;
let pipes = [];
let state = 'waiting';
let score = 0;
let highscore = parseInt(document.cookie) || 0;

function Player() {
    this.x = canvas.width / 5;
    this.y = canvas.height / 3;
    this.dy = 0;
    this.radius = 10;
}
Player.prototype.update = function () {
    let gravity = 1 / 5;
    this.dy += gravity;
    this.y += this.dy;

    if (this.y < this.radius) {
        this.y = this.radius;
        this.dy = 0;
    }
    if (this.y > canvas.height - this.radius) {
        this.y = canvas.height - this.radius;
        endGame()
    }
    for (let pipe of pipes) {
        if (pipe.collides(this)) {
            endGame()
        }
    }
}
Player.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
}
Player.prototype.flop = function () {
    this.dy = -6;
}

function Pipe() {
    let pipeWidth = 100;
    let pipeGap = 150;
    let pipeMargin = 75;
    this.top = new Rectangle(canvas.width, 0, pipeWidth, pipeMargin + Math.random() * (canvas.height - pipeGap - 2 * pipeMargin));
    let bottomY = this.top.y + this.top.height + pipeGap;
    this.bottom = new Rectangle(canvas.width, bottomY, pipeWidth, canvas.height - bottomY);
    this.passed = false;
}
Pipe.prototype.update = function () {
    let moveSpeed = 2;
    this.top.x -= moveSpeed;
    this.bottom.x -= moveSpeed;
    if (!this.passed && this.top.x + this.top.width / 2 <= player.x) {
        this.passed = true;
        score++;
        updateScore();
    }
    if (this.top.x + this.top.width < 0) {
        pipes.splice(pipes.indexOf(this), 1);
    }
}
Pipe.prototype.draw = function () {
    ctx.fillStyle = 'green';
    rects = [this.top, this.bottom];
    for (let rect of rects) {
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.fill();
    }
}
Pipe.prototype.collides = function (player) {
    return this.top.contains(player.x, player.y) || this.bottom.contains(player.x, player.y);
}

function Rectangle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

Rectangle.prototype.contains = function (x, y) {
    return x > this.x && x < this.x + this.width &&
        y > this.y && y < this.y + this.height;
}

let timeUntilNextPipe = 0;
let pipeRate = 2;
function update() {
    if (state === 'playing') {
        player.update();
        timeUntilNextPipe -= physicsUpdateRate / 1000;
        if (timeUntilNextPipe <= 0) {
            timeUntilNextPipe += pipeRate;
            addPipe();
        }
        for (let pipe of pipes) {
            pipe.update();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    for (let pipe of pipes) {
        pipe.draw();
    };
    if (state !== 'playing') {
        ctx.fillStyle = 'white';
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        if (state === 'waiting') {
            ctx.fillText('tap to start', x, y);
        } else if (state === 'finished') {
            ctx.fillText('whoops', x, y);
        }
    }
}

function loop() {
    if (state === 'playing') {
        update();
    } else {
        clearInterval(spawnPipesId);
        clearInterval(increaseScoreId);
    }
    draw();
}

function addPipe() {
    pipes.push(new Pipe())
    console.log('adding pipe')
}

function increaseScore() {
    score++;
    updateScore();
}

function updateScore() {
    scoreDisplay.innerText = 'score = ' + score;
}
function updateHighscore() {
    highscoreDisplay.innerText = 'highscore = ' + highscore;
}

function onTouch() {
    if (state === 'waiting') {
        state = 'playing';
        let pipeRate = 2250;
    }
    if (state === 'playing') {
        player.flop()
    }
}

window.addEventListener('resize', resizeCanvas);
document.addEventListener('keydown', function (e) {
    if (e.code == 'Space') {
        onTouch();
    }
});
canvas.addEventListener('touchstart', function () { onTouch() });
canvas.addEventListener('mousedown', function () { onTouch() });
canvas.onselectstart = function () {
    return false;
};

function init() {
    restartButton.style.color = 'gray';
    restartButton.style.fontWeight = 'normal';
    state = 'waiting';
    pipes.length = 0;
    player = new Player();
    score = 0;
    updateScore();
    updateHighscore();
    resizeCanvas();
}


function endGame() {
    state = 'finished';
    restartButton.style.color = 'white';
    restartButton.style.fontWeight = 'bold';
    if (score > highscore) {
        highscore = score;
        document.cookie = '' + highscore;
    }
}

function restart() {
    if (state === 'finished') {
        init();
    }
}

let lastUpdate = Date.now();
let physicsUpdateRate = 1000 / 60;
let timeUntilNextUpdate = 0;
function loop() {
    let now = Date.now();
    let delta = now - lastUpdate;
    lastUpdate = now;
    timeUntilNextUpdate -= delta;
    if (timeUntilNextUpdate <= 0) {
        timeUntilNextUpdate += physicsUpdateRate;
        update();
    }
    draw();
}

setInterval(loop, 0);
init();