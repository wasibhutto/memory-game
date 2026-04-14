import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card/card';

@Component({
  selector: 'app-root',
  imports: [CommonModule, CardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  cards = signal<{ value: string; isFlipped: boolean; isMatched: boolean }[]>([]);
  flippedCards: number[] = [];
  moves = signal(0);
  matchedPairs = signal(0);
  timer = signal(0);
  highScore = signal<number>(parseInt(localStorage.getItem('highScore') || '0'));
  timerInterval: any;
  visitorCount = signal(0);
  gamesPlayed = signal(0);

  emojis = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑', '🥝', '🍉'];

  constructor() {
    this.startGame();
  }

  ngOnInit() {
    fetch('https://api.countapi.xyz/hit/memory-game-hamza/visits')
      .then(res => res.json())
      .then(data => this.visitorCount.set(data.value));
  }

  trackGamePlayed() {
    fetch('https://api.countapi.xyz/hit/memory-game-hamza/games-played')
      .then(res => res.json())
      .then(data => this.gamesPlayed.set(data.value));
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

    this.playSound('flip');

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
      this.playSound('match');

      if (this.matchedPairs() === 8) {
        clearInterval(this.timerInterval);
        this.trackGamePlayed();
        this.playSound('win');
        if (this.highScore() === 0 || this.moves() < this.highScore()) {
          this.highScore.set(this.moves());
          localStorage.setItem('highScore', this.moves().toString());
        }
      }
    } else {
      this.playSound('wrong');
      setTimeout(() => {
        updated[a].isFlipped = false;
        updated[b].isFlipped = false;
        this.cards.set(updated);
        this.flippedCards = [];
      }, 1000);
    }
  }

  playSound(type: string) {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'flip') {
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    } else if (type === 'match') {
      oscillator.frequency.setValueAtTime(500, ctx.currentTime);
      oscillator.frequency.setValueAtTime(700, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } else if (type === 'win') {
      oscillator.frequency.setValueAtTime(400, ctx.currentTime);
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    }
  }
}