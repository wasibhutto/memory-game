import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card/card';
import { SnakeComponent } from './snake/snake';

@Component({
  selector: 'app-root',
  imports: [CommonModule, CardComponent, SnakeComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {

  gameMode = signal<'memory' | 'snake'>('memory');

  emojis = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑', '🥝', '🍉'];

  cards = signal<any[]>([]);
  moves = signal(0);
  matchedPairs = signal(0);
  timer = signal(0);
  highScore = signal<number>(parseInt(localStorage.getItem('highScore') || '0'));

  visitorCount = signal(0);
  gamesPlayed = signal(0);

  flippedCards: number[] = [];
  timerInterval: any;

  constructor() {
    this.startGame();
  }

  ngOnInit() {
    const url = 'https://memory-game-29374-default-rtdb.firebaseio.com/visitors.json';
    fetch(url)
      .then(res => res.json())
      .then(count => {
        const newCount = (count || 0) + 1;
        this.visitorCount.set(newCount);
        fetch(url, { method: 'PUT', body: JSON.stringify(newCount) });
      });
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  startGame() {
    clearInterval(this.timerInterval);
    const doubled = [...this.emojis, ...this.emojis];
    const shuffled = doubled.sort(() => Math.random() - 0.5);
    this.cards.set(shuffled.map(v => ({ value: v, isFlipped: false, isMatched: false })));
    this.flippedCards = [];
    this.moves.set(0);
    this.matchedPairs.set(0);
    this.timer.set(0);
    this.startTimer();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer.set(this.timer() + 1);
    }, 1000);
  }

  flipCard(index: number) {
    const card = this.cards()[index];
    if (card.isFlipped || card.isMatched || this.flippedCards.length === 2) return;
    const updated = [...this.cards()];
    updated[index].isFlipped = true;
    this.cards.set(updated);
    this.flippedCards.push(index);
    if (this.flippedCards.length === 2) {
      this.moves.set(this.moves() + 1);
      this.checkMatch();
    }
  }

  checkMatch() {
    const [a, b] = this.flippedCards;
    const updated = [...this.cards()];
    if (updated[a].value === updated[b].value) {
      updated[a].isMatched = true;
      updated[b].isMatched = true;
      this.matchedPairs.set(this.matchedPairs() + 1);
      this.flippedCards = [];
      this.cards.set(updated);
      if (this.matchedPairs() === this.emojis.length) {
        clearInterval(this.timerInterval);
        this.gamesPlayed.set(this.gamesPlayed() + 1);
        if (this.highScore() === 0 || this.moves() < this.highScore()) {
          this.highScore.set(this.moves());
          localStorage.setItem('highScore', this.moves().toString());
        }
      }
    } else {
      setTimeout(() => {
        updated[a].isFlipped = false;
        updated[b].isFlipped = false;
        this.cards.set(updated);
        this.flippedCards = [];
      }, 800);
    }
  }
}