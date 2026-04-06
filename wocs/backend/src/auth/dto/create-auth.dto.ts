export class CreateAuthDto {
  name: string;
  email: string;
  password: string;
  role?: string; // optional during self-registration
}
