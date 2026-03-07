import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Công ty TNHH ABC', description: 'Tên tổ chức/doanh nghiệp' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  organizationName: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: 'NguyenVanA' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Nguyen' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)',
  })
  password: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
