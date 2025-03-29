# OnChain Sage Frontend

This is the frontend application for OnChain Sage, an AI-driven decentralized trading assistant built with [Next.js](https://nextjs.org). The frontend provides an intuitive interface for crypto traders to analyze real-time social sentiment and on-chain market data.

## Tech Stack

- **Framework**: Next.js 14+
- **Styling**: Tailwind CSS
- **Data Visualization**: Chart.js/D3.js
- **Language**: TypeScript

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The frontend is organized to support various features including:
- Real-time dashboard for token analytics
- Social sentiment visualization
- On-chain metrics monitoring
- Integration with Raydium and Dex Screener data

## Development

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a custom font designed for optimal readability.

## Learn More

To learn more about the technologies we're using:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Chart.js](https://www.chartjs.org/docs/) - Simple yet flexible JavaScript charting
- [D3.js](https://d3js.org/) - Data-Driven Documents

## Deployment

The application is configured for deployment on [Vercel](https://vercel.com), offering:
- Automatic deployments on merge to main
- Preview deployments for pull requests
- Edge network distribution

Check out our [deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.