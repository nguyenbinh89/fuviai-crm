import { PartialType } from '@nestjs/swagger';
import { CreateContactDto } from './create-contact.dto';

// Tất cả fields đều optional khi update
export class UpdateContactDto extends PartialType(CreateContactDto) {}
