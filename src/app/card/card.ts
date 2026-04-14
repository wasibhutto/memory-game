import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class CardComponent {
  @Input() value: string = '';
  @Input() isFlipped: boolean = false;
  @Input() isMatched: boolean = false;

  flip() {
    if (!this.isMatched) {
      this.isFlipped = !this.isFlipped;
    }
  }
}