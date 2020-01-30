import {Column, Entity, OneToMany,PrimaryGeneratedColumn} from "typeorm";
import {Transaction} from './Transaction.model'


@Entity('Block')
export class Block{
    @PrimaryGeneratedColumn()
    id!:number

    //change to hash
    @Column()
    height!:number

    @OneToMany(type=>Transaction, transaction=>transaction.c)
    transactions?: Transaction[]

}
