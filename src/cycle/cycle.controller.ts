import { Body, Controller, Get, Post } from '@nestjs/common';
import { CycleService } from './cycle.service';

@Controller('cycle')
export class CycleController {
  constructor(private readonly service: CycleService) {}

  /** 理想循环（不计部件效率） */
  @Post('ideal')
  ideal(@Body() body: unknown) {
    return this.service.ideal(body);
  }

  /** 实际循环（计入压气机/涡轮等熵效率） */
  @Post('actual')
  actual(@Body() body: unknown) {
    return this.service.actual(body);
  }

  /** 压比区间扫描寻优 */
  @Post('scan')
  scan(@Body() body: unknown) {
    return this.service.scan(body);
  }

  /** 批量核算：一次提交多组工况，逐组独立成败 */
  @Post('batch')
  batch(@Body() body: unknown) {
    return this.service.batch(body);
  }

  /** 内置示范算例 */
  @Get('demo')
  demo() {
    return this.service.demo();
  }
}
