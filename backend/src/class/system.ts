class OutpassSystem {
  private allow: boolean;
  private lastUpdated: string;
  private threshold: number;

  constructor() {
    this.allow = true;
    this.lastUpdated = new Date().toISOString();
    this.threshold = 3;
  }

  public setSystemConfig(status: boolean, date: string, threshold: number) {
    this.allow = status;
    this.lastUpdated = date;
    this.threshold = threshold;
  }

  public setSystemStatus(status: boolean, date: string) {
    this.allow = status;
    this.lastUpdated = date;
  }

  public getSystemStatus() {
    return this.allow;
  }

  public setThreshold(threshold: number) {
    this.threshold = threshold;
  }

  public getThreshold() {
    return this.threshold;
  }
}

const system = new OutpassSystem();
export default system;
