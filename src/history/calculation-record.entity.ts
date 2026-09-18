import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type CalculationType = 'ideal' | 'actual' | 'scan' | 'batch_item';

/** 每次核算/扫描的输入输出持久化记录 */
@Entity({ name: 'calculation_records' })
export class CalculationRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  type!: CalculationType;

  /** 批量核算内各组工况共享的批次号；非批量为 null */
  @Column({ type: 'uuid', nullable: true })
  batchId!: string | null;

  @Column({ type: 'jsonb' })
  request!: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  response!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
