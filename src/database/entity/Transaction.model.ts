import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Block} from './Block.model'

@Entity('Transaction')
export class Transaction{
    @PrimaryGeneratedColumn()
    id!:number

    @Column()
    transactionType!: string

    @Column()
    rName!:string
    //
    @ManyToOne(type => Block, block=>block.transactions)
    c!:Block
}

