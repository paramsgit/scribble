interface DrawCommand {
  execute(ctx: CanvasRenderingContext2D): void;
  undo?(ctx: CanvasRenderingContext2D): void;
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
  private history: DrawCommand[] = [];

  executeCommand(command: DrawCommand, ctx: CanvasRenderingContext2D) {
    command.execute(ctx);
    this.history.push(command);
  }

  replay(ctx: CanvasRenderingContext2D) {
    console.log("history", this.history);
    this.history.forEach((cmd) => cmd.execute(ctx));
  }

  undoLast(ctx: CanvasRenderingContext2D) {
    console.log(this.history);
    this.history.pop();
    this.history.pop();
    console.log("first", this.history);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.replay(ctx);
  }
}
