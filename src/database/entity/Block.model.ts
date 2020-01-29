import {Column, Entity, OneToMany,PrimaryGeneratedColumn} from "typeorm";
import {Transaction} from './Transaction.model'

@Entity('Block')
export class Block{
    @PrimaryGeneratedColumn()
    id!:number
    @Column()
    height!:number

    @OneToMany(type=>Transaction, transaction=>transaction.c)
    transactions?: Transaction[]

}
