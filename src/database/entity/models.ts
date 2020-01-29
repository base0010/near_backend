
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"


export abstract class Content {
    @PrimaryGeneratedColumn()
    id!:number
}

@Entity('Transactions')
export class Transactions extends Content{
    @Column()
    transactionType!: string

    @Column()
    recieverName!:string

}
@Entity('Blocks')
export class Blocks extends Content{

    @ManyToOne(type => Transactions)

    @JoinColumn()
    transactions?: Transactions

    @Column()

    height!:number
}
