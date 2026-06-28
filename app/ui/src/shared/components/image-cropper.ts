import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { msg } from '@lit/localize';
import { ref } from 'lit/directives/ref.js';
import { localized } from '@/features/localization';
import { imageCropperStyles } from './image-cropper.styles';

export interface ImageCropperCroppedEventDetail {
  blob: Blob;
  previewUrl: string;
}

export interface ImageCropperErrorEventDetail {
  message: string;
}

const MAX_SOURCE_BYTES = 2 * 1024 * 1024;

@customElement('image-cropper')
@localized()
export class ImageCropper extends LitElement {
  @property({ type: Object }) file: File | null = null;
  @property({ type: Number }) aspect = 1;
  @property({ type: Number }) outputSize = 256;
  @property({ type: Boolean }) uploading = false;

  @state() private _zoom = 1;
  @state() private _ready = false;
  @state() private _errorMessage = '';
  @state() private _dragOver = false;

  private _bitmap: ImageBitmap | null = null;
  private _offsetX = 0;
  private _offsetY = 0;
  private _dragging = false;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _canvas: HTMLCanvasElement | null = null;
  private _objectUrl: string | null = null;

  private _onDragOver = (e: DragEvent): void => {
    e.preventDefault();
    this._dragOver = true;
  };

  private _onDragLeave = (): void => {
    this._dragOver = false;
  };

  private _onDrop = (e: DragEvent): void => {
    e.preventDefault();
    this._dragOver = false;
    const file = e.dataTransfer?.files?.[0] ?? null;
    if (file) void this._loadFile(file);
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('dragover', this._onDragOver);
    this.addEventListener('dragleave', this._onDragLeave);
    this.addEventListener('drop', this._onDrop);
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('file') && this.file) {
      void this._loadFile(this.file);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('dragover', this._onDragOver);
    this.removeEventListener('dragleave', this._onDragLeave);
    this.removeEventListener('drop', this._onDrop);
    this._releaseObjectUrl();
    this._bitmap?.close();
    this._bitmap = null;
  }

  private _releaseObjectUrl(): void {
    if (this._objectUrl) {
      URL.revokeObjectURL(this._objectUrl);
      this._objectUrl = null;
    }
  }

  private async _loadFile(file: File): Promise<void> {
    this._errorMessage = '';
    if (file.size > MAX_SOURCE_BYTES) {
      this._emitError(msg('Image must be smaller than 2 MB.'));
      return;
    }
    try {
      this._bitmap?.close();
      this._bitmap = await createImageBitmap(file);
      this._offsetX = 0;
      this._offsetY = 0;
      this._zoom = 1;
      this._ready = true;
      this._releaseObjectUrl();
      this._objectUrl = URL.createObjectURL(file);
      await this.updateComplete;
      this._draw();
      this._emitCropped();
    } catch {
      this._emitError(msg('Could not read that image.'));
    }
  }

  private _emitError(message: string): void {
    this._errorMessage = message;
    this.dispatchEvent(
      new CustomEvent<ImageCropperErrorEventDetail>('error', {
        detail: { message },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _emitCropped(): void {
    const canvas = this._canvas;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const previewUrl = this._objectUrl ?? '';
      this.dispatchEvent(
        new CustomEvent<ImageCropperCroppedEventDetail>('cropped', {
          detail: { blob, previewUrl },
          bubbles: true,
          composed: true,
        }),
      );
    }, 'image/png');
  }

  private _setCanvasRef(el: Element | undefined): void {
    this._canvas = (el as HTMLCanvasElement | null) ?? null;
  }

  private _draw(): void {
    const canvas = this._canvas;
    if (!canvas || !this._bitmap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = this.outputSize;
    if (canvas.width !== size) canvas.width = size;
    if (canvas.height !== size) canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const bmp = this._bitmap;
    const scale = this._zoom;
    const drawW = bmp.width * scale;
    const drawH = bmp.height * scale;
    let dx = (size - drawW) / 2 + this._offsetX;
    let dy = (size - drawH) / 2 + this._offsetY;
    if (drawW < size) {
      dx = Math.max(0, Math.min(dx, size - drawW));
    } else {
      dx = Math.min(0, Math.max(dx, size - drawW));
    }
    if (drawH < size) {
      dy = Math.max(0, Math.min(dy, size - drawH));
    } else {
      dy = Math.min(0, Math.max(dy, size - drawH));
    }
    this._offsetX = dx - (size - drawW) / 2;
    this._offsetY = dy - (size - drawH) / 2;
    ctx.drawImage(bmp, dx, dy, drawW, drawH);
  }

  private _handlePointerDown(e: PointerEvent): void {
    if (!this._ready) return;
    this._dragging = true;
    this._dragStartX = e.clientX - this._offsetX;
    this._dragStartY = e.clientY - this._offsetY;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (!this._dragging) return;
    this._offsetX = e.clientX - this._dragStartX;
    this._offsetY = e.clientY - this._dragStartY;
    this._draw();
  }

  private _handlePointerUp(): void {
    if (!this._dragging) return;
    this._dragging = false;
    this._draw();
    this._emitCropped();
  }

  private _handleZoom(e: InputEvent): void {
    this._zoom = Number((e.target as HTMLInputElement).value);
    this._draw();
    this._emitCropped();
  }

  private _handleFilePick(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) void this._loadFile(file);
    input.value = '';
  }

  private _openPicker(): void {
    this.shadowRoot?.querySelector<HTMLInputElement>('.file-input')?.click();
  }

  private _handleChangeImage(): void {
    this._ready = false;
    this._bitmap?.close();
    this._bitmap = null;
    this._releaseObjectUrl();
    this._errorMessage = '';
  }

  render(): TemplateResult {
    return html`
      <div class="root">
        <input
          class="file-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          @change=${this._handleFilePick}
        />
        ${this._ready && this._bitmap
          ? html`
              <div class="canvas-wrap">
                <canvas
                  ${ref(this._setCanvasRef.bind(this))}
                  @pointerdown=${this._handlePointerDown}
                  @pointermove=${this._handlePointerMove}
                  @pointerup=${this._handlePointerUp}
                ></canvas>
                ${this.uploading
                  ? html`<div class="uploading-overlay"><div class="spinner"></div></div>`
                  : null}
              </div>
              <div class="controls">
                <label for="zoom">${msg('Zoom')}</label>
                <input
                  id="zoom"
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  .value=${String(this._zoom)}
                  @input=${this._handleZoom}
                />
                <button
                  type="button"
                  class="btn-change"
                  @click=${this._handleChangeImage}
                >${msg('Change image')}</button>
              </div>
            `
          : html`
              <div
                class="drop-zone ${this._dragOver ? 'drag-over' : ''}"
                @click=${this._openPicker}
              >
                <svg
                  class="drop-zone-icon"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p class="drop-zone-heading">${msg('Upload image')}</p>
                <p class="drop-zone-hint">${msg('PNG, JPEG, WebP — max 2 MB')}</p>
                <button
                  type="button"
                  class="btn-choose"
                  @click=${(e: Event) => { e.stopPropagation(); this._openPicker(); }}
                >${msg('Choose file')}</button>
              </div>
            `}
        ${this._errorMessage
          ? html`<p class="error-msg" role="alert">${this._errorMessage}</p>`
          : null}
      </div>
    `;
  }

  static styles = imageCropperStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'image-cropper': ImageCropper;
  }
}
