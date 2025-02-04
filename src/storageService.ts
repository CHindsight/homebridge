import { resolve } from 'node:path'

import fs from 'fs-extra'

export class StorageService {
  constructor(
    public baseDirectory: string,
  ) {}

  public initSync(): void {
    return fs.ensureDirSync(this.baseDirectory)
  }

  public getItemSync<T>(itemName: string): T | null {
    const filePath = resolve(this.baseDirectory, itemName)

    if (!fs.pathExistsSync(filePath)) {
      return null
    }

    return fs.readJsonSync(filePath)
  }

  public async getItem<T>(itemName: string): Promise<T | null> {
    const filePath = resolve(this.baseDirectory, itemName)

    if (!await fs.pathExists(filePath)) {
      return null
    }

    return await fs.readJson(filePath)
  }

  public setItemSync(itemName: string, data: Record<any, any> | Array<any>): void {
    return fs.writeJsonSync(resolve(this.baseDirectory, itemName), data)
  }

  public setItem(itemName: string, data: Record<any, any> | Array<any>): Promise<void> {
    return fs.writeJson(resolve(this.baseDirectory, itemName), data)
  }

  public copyItem(srcItemName: string, destItemName: string): Promise<void> {
    return fs.copyFile(resolve(this.baseDirectory, srcItemName), resolve(this.baseDirectory, destItemName))
  }

  public copyItemSync(srcItemName: string, destItemName: string): void {
    return fs.copyFileSync(resolve(this.baseDirectory, srcItemName), resolve(this.baseDirectory, destItemName))
  }

  public removeItemSync(itemName: string): void {
    return fs.removeSync(resolve(this.baseDirectory, itemName))
  }
}
