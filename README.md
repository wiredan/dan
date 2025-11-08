# AgriLink: Decentralized Agribusiness Network

[cloudflarebutton]

AgriLink is a sophisticated, decentralized platform designed to revolutionize the agribusiness supply chain. It directly connects farmers, distributors, and investors, creating a transparent and efficient marketplace for food crops. The platform features secure user verification (KYC), an integrated payment and escrow system with automated fee splitting, and advanced order tracking with dispute resolution. An integrated Education Hub provides valuable market insights, while a dedicated admin panel ensures smooth platform governance. The entire experience is wrapped in a visually stunning, professional interface inspired by leading financial platforms, with support for multiple languages and currencies.

## Key Features

-   **Decentralized Marketplace:** A transparent and efficient marketplace for food crops, directly connecting farmers, distributors, and investors.
-   **Secure User Verification (KYC):** Ensures trust and compliance within the network.
-   **Integrated Payments & Escrow:** Secure, automated payment processing with fee splitting and an escrow system to protect all parties.
-   **Advanced Order Tracking:** Real-time visualization of the order lifecycle, from payment to final delivery, with a built-in dispute resolution mechanism.
-   **Education Hub:** A content-rich section with market analysis and an AI-powered assistant to help users make informed decisions.
-   **Multi-Language & Multi-Currency Support:** Accessible to a global audience with support for multiple languages and currencies.
-   **Secure Admin Panel:** A restricted-access interface for platform administrators to manage users, oversee transactions, and resolve disputes.

## Technology Stack

-   **Frontend:** React, Vite, React Router, Zustand, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
-   **Backend:** Hono running on Cloudflare Workers
-   **Database:** Cloudflare D1
-   **Storage & Caching:** Cloudflare KV
-   **Runtime & Build Tool:** Bun
-   **Deployment:** Cloudflare Workers

## Project Structure

This project is a monorepo containing two main parts:

-   `frontend/`: The React single-page application that constitutes the user interface.
-   `worker/`: The Hono-based backend API running as a Cloudflare Worker.
-   `shared/`: TypeScript types and interfaces shared between the frontend and the worker to ensure type safety.

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Bun](https://bun.sh/) installed on your machine.
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated with your Cloudflare account (`wrangler login`).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd agrilink_platform
    ```

2.  **Install dependencies:**
    The project uses Bun for package management. Run the following command in the root directory:
    ```bash
    bun install
    ```

### Running Locally

To start the local development server, which runs both the Vite frontend and the Wrangler worker concurrently, use:

```bash
bun run dev
```

This will typically start the frontend on `http://localhost:3000` and the worker on `http://localhost:8787`. The Vite dev server is pre-configured to proxy API requests to the worker.

## Development

-   **Frontend:** All frontend code is located in the `src` directory. Pages are in `src/pages`, and reusable components are in `src/components`.
-   **Backend:** The API is built with Hono and resides in the `worker` directory. Define new API routes in `worker/user-routes.ts` and create new data entities in `worker/entities.ts`.
-   **Shared Types:** To maintain type safety between the client and server, define all shared data structures in the `shared/types.ts` file.

## Deployment

This application is designed for seamless deployment to the Cloudflare global network.

### Deploying to Cloudflare

1.  **Build the application:**
    This command bundles both the frontend and the worker for production.
    ```bash
    bun run build
    ```

2.  **Deploy the application:**
    This command deploys your application using the Wrangler CLI.
    ```bash
    bun run deploy
    ```

Alternatively, you can deploy directly from your GitHub repository using the button below.

[cloudflarebutton]

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License.