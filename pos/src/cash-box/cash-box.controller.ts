import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
  ParseFloatPipe,
} from '@nestjs/common';
import { CashBoxService } from './cash-box.service';
import { CreateCashBoxDto } from './dto/create-cash-box.dto';
import { UpdateCashBoxDto } from './dto/update-cash-box.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@ApiTags('cash-box')
@Controller('cash-box')
export class CashBoxController {
  constructor(private readonly cashBoxService: CashBoxService) {}

  @ApiOperation({ summary: 'Create a new cash box' })
  @ApiCreatedResponse({
    description: 'The cash box has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createCashBoxDto: CreateCashBoxDto,
  ) {
    createCashBoxDto.user = req.user;
    return this.cashBoxService.create(createCashBoxDto);
  }

  @ApiOperation({ summary: 'Get all cash boxes' })
  @ApiOkResponse({ description: 'Return all cash boxes.' })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.cashBoxService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a cash box by ID' })
  @ApiOkResponse({ description: 'Return a cash box.' })
  @ApiNotFoundResponse({ description: 'Cash box not found.' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.cashBoxService.findOne(+id, req.user.id);
  }

  @ApiOperation({ summary: 'Update a cash box by ID' })
  @ApiOkResponse({ description: 'The cash box has been successfully updated.' })
  @ApiNotFoundResponse({ description: 'Cash box not found.' })
  @Patch(':id')
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateCashBoxDto: UpdateCashBoxDto,
  ) {
    return this.cashBoxService.update(+id, updateCashBoxDto, req.user.id);
  }

  @ApiOperation({ summary: 'Delete a cash box by ID' })
  @ApiOkResponse({ description: 'The cash box has been successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Cash box not found.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cashBoxService.remove(+id);
  }

  @ApiOperation({ summary: 'Cash in the cash box' })
  @ApiOkResponse({ description: 'Se añadió efectivo a la caja.' })
  @Put(':identifier/cash-in/:amount')
  cashIn(
    @Request() req: RequestWithUser,
    @Param('identifier') identifier: string,
    @Param('amount', ParseFloatPipe) amount: number,
  ) {
    return this.cashBoxService.cashIn(identifier, amount, req.user.id);
  }

  @ApiOperation({ summary: 'Cash out from the cash box' })
  @ApiOkResponse({ description: 'Se dedujo efectivo de la caja.' })
  @Put(':identifier/cash-out/:amount')
  cashOut(
    @Request() req: RequestWithUser,
    @Param('identifier') identifier: string,
    @Param('amount', ParseFloatPipe) amount: number,
  ) {
    return this.cashBoxService.cashOut(identifier, amount, req.user.id);
  }

  @ApiOperation({ summary: 'Adjust the balance of the cash box' })
  @ApiOkResponse({ description: 'Se ajustó el saldo de la caja.' })
  @Put(':identifier/adjust-balance/:newBalance')
  adjustBalance(
    @Request() req: RequestWithUser,
    @Param('identifier') identifier: string,
    @Param('newBalance', ParseFloatPipe) newBalance: number,
  ) {
    return this.cashBoxService.adjustBalance(identifier, newBalance, req.user.id);
  }
}
