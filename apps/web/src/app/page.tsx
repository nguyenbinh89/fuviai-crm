import { redirect } from 'next/navigation';

// Root redirect — nếu có session → dashboard, không → login
export default function HomePage() {
  redirect('/dashboard');
}
