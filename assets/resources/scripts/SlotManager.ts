import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlotManager')
export class SlotManager extends Component {

  @property({ type: Node }) panelLines: Node = null;

  checkWinLines(result: number[][]): { line: number; symbol: number }[] {
    const winLines = [
      [[0, 0], [1, 0], [2, 0]], // Line 1 
      [[0, 1], [1, 1], [2, 1]], // Line 2 
      [[0, 2], [1, 2], [2, 2]], // Line 3 
      [[0, 0], [0, 1], [0, 2]], // Line 4 
      [[1, 0], [1, 1], [1, 2]], // Line 5 
      [[2, 0], [2, 1], [2, 2]], // Line 6 
      [[0, 0], [1, 1], [2, 2]], // Line 7 
      [[0, 2], [1, 1], [2, 0]], // Line 8 
    ];

    const wins: { line: number; symbol: number }[] = [];

    for (let i = 0; i < winLines.length; i++) {
      const line = winLines[i];
      const symbols = line.map(([x, y]) => result[x][y]);

      if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        wins.push({ line: i + 1, symbol: symbols[0] });
      }
    }

    return wins;
  }

  showWinLines(wins: { line: number; symbol: number }[]) {
    this.panelLines.children.forEach((lineNode, index) => {
      lineNode.active = false;
    });

    wins.forEach(win => {
      const lineNode = this.panelLines.children[win.line - 1];
      if (lineNode) {
        lineNode.active = true;
      }
    });
  }

  resetWinLines() {
    this.panelLines.children.forEach(lineNode => {
      lineNode.active = false;
    });
  }

}


