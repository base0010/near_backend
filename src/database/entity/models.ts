
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"


export abstract class Content {
    @PrimaryGeneratedColumn()
    id!:number
}

@Entity('Transactions')
export class Transactions extends Content{
    @Column()
    transactionType!: string

}
@Entity('Block')
export class Block extends Content{

    @ManyToOne(type => Transactions)

    @JoinColumn()
    transactions?: Transactions

    @Column()
    hash!: string
}
