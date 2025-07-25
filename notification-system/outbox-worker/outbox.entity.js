import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Outbox {
  @PrimaryGeneratedColumn()
  id;

  @Column()
  event_type;

  @Column({ type: 'jsonb' })
  payload;

  @Column({ default: false })
  processed;
}
