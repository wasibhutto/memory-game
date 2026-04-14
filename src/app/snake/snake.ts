import { Component, ElementRef, ViewChild, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-snake',
  imports: [CommonModule],
  templateUrl: './snake.html',
  styleUrl: './snake.css'
})
export class SnakeComponent implements OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  score = signal(0);
  highScore = signal<number>(parseInt(localStorage.getItem('snakeHighScore') || '0'));
  gameOver = signal(false);
  gameStarted = signal(false);

  private ctx!: CanvasRenderingContext2D;
  private snake = [{ x: 10, y: 10 }];
  private food = { x: 5, y: 5 };
  private direction = 'RIGHT';
  private nextDirection = 'RIGHT';
  private gridSize = 20;
  private gameLoop: any;

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.drawInitialScreen();
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    const map: any = {
      ArrowUp: 'UP', ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT', ArrowRight: 'RIGHT'
    };
    if (map[e.key]) {
      e.preventDefault();
      this.changeDirection(map[e.key]);
    }
  }

  changeDirection(dir: string) {
    const opposites: any = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (opposites[dir] !== this.direction) {
      this.nextDirection = dir;
    }
  }

  startGame() {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.score.set(0);
    this.gameOver.set(false);
    this.gameStarted.set(true);
    this.placeFood();
    clearInterval(this.gameLoop);
    this.gameLoop = setInterval(() => this.tick(), 200);
  }

  tick() {
    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    if (this.direction === 'UP') head.y--;
    if (this.direction === 'DOWN') head.y++;
    if (this.direction === 'LEFT') head.x--;
    if (this.direction === 'RIGHT') head.x++;

    const cols = 400 / this.gridSize;
    const rows = 400 / this.gridSize;

    // Wall collision
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      this.endGame(); return;
    }

    // Self collision
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.endGame(); return;
    }

    this.snake.unshift(head);

    // Eat food
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score.set(this.score() + 10);
      this.placeFood();
      this.playSound('eat');
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  placeFood() {
    const cols = 400 / this.gridSize;
    const rows = 400 / this.gridSize;
    this.food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  }

  playSound(type: string) {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'eat') {
      oscillator.frequency.setValueAtTime(500, ctx.currentTime);
      oscillator.frequency.setValueAtTime(700, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } else if (type === 'die') {
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.setValueAtTime(100, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    }
  }

  draw() {
    const ctx = this.ctx;
    const g = this.gridSize;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 400, 400);

    // Food
    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.arc(this.food.x * g + g/2, this.food.y * g + g/2, g/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    this.snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#4aed88' : '#4a90e2';
      ctx.beginPath();
      ctx.roundRect(seg.x * g + 1, seg.y * g + 1, g - 2, g - 2, 4);
      ctx.fill();
    });
  }

  drawInitialScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = '#4a90e2';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press Start to Play!', 200, 200);
  }

  endGame() {
    clearInterval(this.gameLoop);
    this.gameOver.set(true);
    this.playSound('die');
    if (this.score() > this.highScore()) {
      this.highScore.set(this.score());
      localStorage.setItem('snakeHighScore', this.score().toString());
    }
  }

  ngOnDestroy() {
    clearInterval(this.gameLoop);
  }
}