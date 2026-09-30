# ReGen Mapper 🌱

A web application for tracking and visualizing reforestation efforts. ReGen Mapper helps communities and organizations document their tree planting activities and monitor their environmental impact.
- You can view the live demo on: https://regen-mapper-2fbn.vercel.app/

<img width="1334" height="673" alt="image" src="https://github.com/user-attachments/assets/8b181a9a-6b2d-4e35-bff4-327cb7b23278" />

## Features

### 🗺️ Interactive Map View
- Visualize restoration zones and planting sites
- Built with React-Leaflet for smooth map interactions
- Currently centered on Thika reforestation hub

### 📝 Planting Log System
- Record tree planting activities
- Track species, quantity, location, and date
- Add notes and additional details
- Data stored securely in Supabase

### 📬 Contact System
- User-friendly contact form
- Direct communication channel for questions and feedback
- Messages stored and managed through Supabase

### 📊 Impact Dashboard
- Track restoration progress
- View planting statistics
- Monitor environmental impact (Coming Soon)

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: React Bootstrap
- **Mapping**: React Leaflet
- **Database**: Supabase
- **Styling**: CSS with custom glass-morphism effects

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/Raphael-Kamau/regen-mapper.git
cd regen-mapper
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Fill in your Supabase credentials:
  ```
  REACT_APP_SUPABASE_URL=your_supabase_url
  REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

4. Start the development server:
```bash
npm start
```

## Database Setup

The application requires two tables in Supabase:

### Planting Logs Table
```sql
create table planting_logs (
  id uuid default uuid_generate_v4() primary key,
  species text not null,
  quantity integer not null,
  location text not null,
  date date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Contact Messages Table
```sql
create table contact_messages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Raphael Kamau - [GitHub Profile](https://github.com/Raphael-Kamau)

Project Link: [https://github.com/Raphael-Kamau/regen-mapper](https://github.com/Raphael-Kamau/regen-mapper)
