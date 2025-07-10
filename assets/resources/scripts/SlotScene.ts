import {_decorator, Button, instantiate, Node, Prefab, Sprite, SpriteFrame, tween, UITransform, Vec3} from "cc";
import { SlotItem } from "./SlotItem";
import { SlotManager } from "./SlotManager";

const { ccclass, property } = _decorator;

@ccclass("SlotScene")
export class SlotScene extends SlotManager {

  @property({ type: [Node] }) itemLayerNode: Node[] = [];
  @property({ type: Prefab }) itemPrefab: Prefab = null;
  @property({ type: Node }) btnSpin: Node = null;
  @property({ type: Node }) btnStop: Node = null;

  @property({ type: Sprite }) speedIcon: Sprite = null;
  @property({ type: [SpriteFrame] }) speedIcons: SpriteFrame[] = [];
  
  private itemNodeList: Node[][] = [];
  private rollSchedule: Function;
  private isInGame: boolean = false;
  private gameResult: any = null;
  private tempData: any = null;

  private speedLevel: number = 1; // 1 = normal, 2 = level 1, 3 = level 2

  readonly rollColumn: number = 3;

  async start() {
    this.initItem();
    this.updateSpeedIcon();
  }

  initItem() {

    const size = this.itemLayerNode[0].getComponent(UITransform)!.contentSize;
    const itemH = size.height / 3;

    for (let index = 0; index < 3; index++) {
      this.itemNodeList[index] = [];
      this.itemLayerNode[index].removeAllChildren();

      for (let k = 0; k < 4; k++) {
        const randomNum = Math.floor(Math.random() * 8) + 1;
        const node = instantiate(this.itemPrefab);

        this.itemNodeList[index].push(node);
        this.itemLayerNode[index].addChild(node);

        node.getComponent(SlotItem)?.initData(randomNum);
        node.setPosition(new Vec3(0, size.height + itemH / 2 - itemH * k, 0));
      }
    }
  }

  onSpinClick() {
    this.requestSpin();
  }

  onInstantStopClick() {
    this.instantStopRoll();
  }

  onSpeedClickNew(event: Event, number: string) {
    this.speedLevel++;
    if (this.speedLevel > 3) {
      this.speedLevel = 1;
    }
    this.updateSpeedIcon();
    console.log("Speed Level:", this.speedLevel);
  }

  updateSpeedIcon() {
    const index = this.speedLevel - 1;
    if (this.speedIcon && this.speedIcons[index]) {
      this.speedIcon.spriteFrame = this.speedIcons[index];
    }
  }

  createTempData() {
    const result: number[][] = [];

    for (let col = 0; col < this.rollColumn; col++) {
      result[col] = [];
      for (let row = 0; row < 3; row++) {
        const symbol = Math.floor(Math.random() * 8) + 1;
        result[col].unshift(symbol);
      }
    }
    this.tempData = result.map((col) => [...col]);
    this.gameResult = JSON.parse(JSON.stringify(result));
    console.log("Game Result:", this.gameResult);
  }

  requestSpin() {

    if (this.isInGame) return;

    this.createTempData();
    this.isInGame = true;

    this.resetWinLines();
    this.rollStart();

    if (this.btnSpin) this.btnSpin.active = false;
    if (this.btnStop) this.btnStop.active = true;
  }

  rollStart() {

    let moveSpeed = 65;
    let nextTime_ = 0.1;
    let stopInterval_ = 0.05;
    let stoptime = stopInterval_ * 5 + 0.5;

    if (this.speedLevel === 2) {
      nextTime_ = 0;
      stopInterval_ = 0;
      stoptime = 0.20;
    } else if (this.speedLevel === 3) {
      nextTime_ = 0;
      stopInterval_ = 0;
      stoptime = 0.05;
    }

    let nextTime = 0;
    let stopInterval = 0;
    let rowStopTag: boolean[] = [];
    let rowRunTag: boolean[] = [];
    let alreadyStop = -1;
    let alreadyRun = -1;

    for (let i = 0; i < this.rollColumn; i++) {
      if (this.speedLevel == 2 || this.speedLevel == 3) {
        rowStopTag.push(true);
        rowRunTag.push(true);
      } else {
        rowStopTag.push(false);
        rowRunTag.push(false);
      }
    }

    rowStopTag[0] = true;

    const size = this.itemLayerNode[0].getComponent(UITransform)!.contentSize;
    const itemH = size.height / 3;

    if (this.rollSchedule) {
      this.unschedule(this.rollSchedule);
      this.rollSchedule = null;
    }

    this.rollSchedule = (dt: number) => {
      stoptime -= dt;
      nextTime -= dt;

      if (nextTime <= 0 && alreadyRun < this.rollColumn - 1) {
        alreadyRun++;
        rowRunTag[alreadyRun] = true;
        nextTime = nextTime_;
      }

      if (
        stoptime <= 0 &&
        alreadyStop >= 0 &&
        stopInterval <= 0 &&
        alreadyStop < this.rollColumn - 1
      ) {
        rowStopTag[alreadyStop + 1] = true;
      }

      if (stoptime <= 0) stopInterval -= dt;

      for (let index = 0; index < this.rollColumn; index++) {
        if (alreadyStop >= index || !rowRunTag[index]) continue;

        for (let k = 0; k < this.itemNodeList[index].length; k++) {
          const node = this.itemNodeList[index][k];
          node.setPosition(node.position.x,node.position.y - moveSpeed,node.position.z);

          if (node.position.y < -itemH / 2) {
            node.setPosition(node.position.x,size.height + itemH / 2,node.position.z);
            if (
              stoptime <= 0 &&
              rowStopTag[index] &&
              stopInterval <= 0 &&
              this.gameResult &&
              this.tempData
            ) {
              if (this.tempData[index].length > 0) {
                (node as any).showIndex = this.tempData[index].length;
                node.getComponent(SlotItem)?.setItemIcon(this.tempData[index].pop());
              } else {
                (node as any).showIndex = 0;
                node.getComponent(SlotItem)?.setItemIcon(Math.floor(Math.random() * 8) + 1);

                alreadyStop = index;
                stopInterval = stopInterval_;

                this.playStopAct(index);

                if (index === this.rollColumn - 1) {
                  if (this.rollSchedule) {
                    this.unschedule(this.rollSchedule);
                    this.rollSchedule = null;
                  }

                  this.rundetimeCallBack(0.1, () => {
                    this.gameEnd();
                  });
                }
              }
            } else {
              node.getComponent(SlotItem)?.setBlurItemIcon(Math.floor(Math.random() * 8) + 1);
            }
          }
        }
      }
    };

    this.schedule(this.rollSchedule);
  }

  instantStopRoll() {
    if (!this.isInGame || !this.rollSchedule) return;

    this.unschedule(this.rollSchedule);
    this.rollSchedule = null;

    const size = this.itemLayerNode[0].getComponent(UITransform)!.contentSize;
    const itemH = size.height / 3;

    for (let index = 0; index < this.rollColumn; index++) {
      const column = this.itemNodeList[index];

      column.forEach((node, k) => {
        (node as any).showIndex = k;
      });

      column.sort((a, b) => (a as any).showIndex - (b as any).showIndex);

      for (let k = 0; k < column.length; k++) {
        const node = column[k];
        const stopY = size.height + itemH / 2 - itemH * k;

        let symbol: number;
        if (k < 3) {
          if (this.tempData[index] && this.tempData[index].length > 0) {
            symbol = this.tempData[index].pop();
          } else {
            symbol = this.gameResult[index][2 - k];
          }
          node.getComponent(SlotItem)?.setItemIcon(symbol);
        } else {
          node.getComponent(SlotItem)?.setItemIcon(Math.floor(Math.random() * 8) + 1);
        }

        node.setPosition(new Vec3(0, stopY, 0));
      }

      this.playStopAct(index);
    }

    this.rundetimeCallBack(0.1, () => {
      this.gameEnd();
    });
  }

  gameEnd() {

    const wins = this.checkWinLines(this.gameResult);

    if (wins.length > 0) {

      wins.forEach((win) => {
        console.log(`Win on Line ${win.line}`);
        this.showWinLines(wins);
      });

      if (this.btnStop) this.btnStop.active = false;

      if (this.btnSpin) {
        this.btnSpin.active = true;
        this.btnSpin.getComponent(Button).interactable = false;
      }
      this.rundetimeCallBack(3, () => {
        if (this.btnSpin) this.btnSpin.getComponent(Button).interactable = true;
        this.isInGame = false;
      });

    } else {
      console.log("No Winning Lines");
      if (this.btnSpin) {
        this.btnSpin.active = true;
        this.btnSpin.getComponent(Button).interactable = true;
      }
      if (this.btnStop) this.btnStop.active = false;
      this.isInGame = false;
    }
  }

  playStopAct(index: number) {
    const size = this.itemLayerNode[0].getComponent(UITransform)!.contentSize;
    const itemH = size.height / 3;

    this.itemNodeList[index].sort((a, b) => (a as any).showIndex - (b as any).showIndex);

    for (let k = 0; k < this.itemNodeList[index].length; k++) {
      const node = this.itemNodeList[index][k];
      const showIndex = (node as any).showIndex;
      const stopY = size.height + itemH / 2 - itemH * showIndex;
      const time = Math.abs(stopY - 7 - node.position.y) / (120 * 60);

      tween(node)
        .to(time, { position: new Vec3(0, stopY - 10, 0) })
        .to(0.1, { position: new Vec3(0, stopY, 0) })
        .start();
    }
  }

  rundetimeCallBack(time: number, callBack: Function) {
    tween(this.node)
      .delay(time)
      .call(() => callBack())
      .start();
  }
}
