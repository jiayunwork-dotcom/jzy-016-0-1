import { Controller, Get } from '@nestjs/common';
import { DEFAULTS, DEMO_CASE } from '../config/defaults';

/**
 * 约定回显：默认值、材料温度上限的处理方式与各项容差。
 * 调用方据此了解服务端行为，无需翻阅源码。
 */
@Controller('conventions')
export class ConventionsController {
  @Get()
  conventions() {
    return {
      gas: {
        defaultKappa: DEFAULTS.kappa,
        defaultGasConstant: DEFAULTS.gasConstant,
        cpDerivation:
          'cp = κ·R/(κ−1)：定压比热随比热比自洽变化，绝不使用与比热比脱钩的固定值',
      },
      materialTemperatureLimit: {
        field: 'turbineInletTempMax',
        policy: 'flag_only',
        description:
          '涡轮入口温度超过材料上限时，结果显式标注「受入口温度限制」（temperatureLimited=true），' +
          '仍按给定温度计算并返回，绝不悄悄截断到上限；未提供上限则不截断',
      },
      validation: {
        pressureRatio: '(1, +∞)，严格大于 1',
        inletTemperature: '(0, +∞) K，热力学温度必须为正',
        kappa: '(1, +∞)，比热比必须大于 1',
        compressorEfficiency: '(0, 1]',
        turbineEfficiency: '(0, 1]',
        turbineInletTemperature: '不得低于进气温度',
        heatInputZero:
          '加热量为零（或负）时 thermalEfficiency 返回 null，不靠除零编造假效率',
      },
      defaults: {
        inletPressure: DEFAULTS.inletPressure,
        batchEfficiencyWhenOmitted: DEFAULTS.compressorEfficiency,
        scan: DEFAULTS.scan,
      },
      tolerances: DEFAULTS.tolerances,
      demoCase: DEMO_CASE,
    };
  }
}
