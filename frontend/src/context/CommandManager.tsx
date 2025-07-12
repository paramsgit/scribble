interface DrawCommand {
  execute(ctx: CanvasRenderingContext2D): void;
  undo?(ctx: CanvasRenderingContext2D): void;
}

// Wrapper interface to include commandId
export interface CommandHistoryItem {
  id: string;
  command: DrawCommand;
  index?: number;
}

export class DrawLineCommand implements DrawCommand {
  constructor(
    private x1: number,
    private y1: number,
    private x2: number,
    private y2: number,
    private color: string = "#000",
    private width: number = 2
  ) {}

  execute(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
  }
}

export class CommandManager {
  private history: CommandHistoryItem[] = [];

  executeCommand(command: DrawCommand, ctx: CanvasRenderingContext2D) {
    const id = this.generateCommandId();
    command.execute(ctx);
    this.history.push({ id, command });
    return { id, command, index: this.history.length - 1 };
  }

  replay(ctx: CanvasRenderingContext2D) {
    console.log("history", this.history);
    this.history.forEach((item) => item.command.execute(ctx));
  }

  undoLast(ctx: CanvasRenderingContext2D) {
    console.log(this.history);
    this.history.pop();
    this.history.pop();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.replay(ctx);
  }

  /**
   * Undoes commands from start index to the end of history (inclusive).
   * Only allowed if `last` is actually the last index of the history.
   */
  undoRange(start: number, last: number, ctx: CanvasRenderingContext2D) {
    if (last !== this.history.length - 1) {
      console.warn(
        "Undo range failed: 'last' is not the last index in history."
      );
      return;
    }

    if (start < 0 || start > last || last >= this.history.length) {
      console.warn("Invalid range for undo.");
      return;
    }

    // Remove commands from start to the end
    this.history.splice(start, last - start + 1);

    // Clear canvas and redraw remaining history
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.replay(ctx);
  }

  private generateCommandId(): string {
    return crypto.randomUUID(); // if supported
    // Or fallback: return (Date.now() + Math.random()).toString(36);
  }
}
