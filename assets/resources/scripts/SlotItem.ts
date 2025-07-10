import { _decorator, Component, Node, Sprite, SpriteFrame } from "cc";
const { ccclass, property } = _decorator;

@ccclass("SlotItem")
export class SlotItem extends Component {
  @property(Node) iconNode: Node = null!;

  @property({ type: [SpriteFrame] }) itemFrameIcon: SpriteFrame[] = [];
  @property({ type: [SpriteFrame] }) itemFrameBlurIcon: SpriteFrame[] = [];

  private data: number = 0;

  initData(data: number) {
    this.setItemIcon(data);
  }

  setItemIcon(data: number): void {
    this.data = data;

    this.iconNode.active = true;

    const spriteComponent = this.iconNode.getComponent(Sprite);
    if (spriteComponent) {
      spriteComponent.spriteFrame = this.itemFrameIcon[this.data - 1];
    }
  }

  setBlurItemIcon(data: number): void {
    this.data = data;

    this.iconNode.active = true;

    const spriteComponent = this.iconNode.getComponent(Sprite);
    if (spriteComponent) {
      spriteComponent.spriteFrame = this.itemFrameBlurIcon[this.data - 1];
    }
  }
  
}
