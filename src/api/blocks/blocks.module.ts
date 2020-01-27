import { Module } from '@nestjs/common';
import {BlocksGateway} from "./blocks.gateway";

@Module({
    providers:[BlocksGateway]
})
export class BlocksModule {}
