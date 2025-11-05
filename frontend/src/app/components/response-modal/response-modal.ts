import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-response-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './response-modal.html',
  styleUrls: ['./response-modal.css']
})
export class ResponseModalComponent {
  @Input() question: any;
  @Output() close = new EventEmitter<void>();

  // Lógica eliminada temporalmente para permitir la compilación

  closeModal() {
    this.close.emit();
  }
}
