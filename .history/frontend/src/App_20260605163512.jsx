function App() {

    return (

        <div className="min-h-screen bg-[#f5f7fb] flex">

            {/* SIDEBAR */}

            <aside className="w-64 bg-white border-r border-gray-200 p-6">

                <h1 className="text-2xl font-bold text-gray-800 mb-10">
                    FraudShield
                </h1>

                <nav className="space-y-4">

                    <div className="text-blue-600 font-semibold">
                        Overview
                    </div>

                    <div className="text-gray-500">
                        Fraud Analytics
                    </div>

                    <div className="text-gray-500">
                        Transactions
                    </div>

                    <div className="text-gray-500">
                        Risk Monitoring
                    </div>

                    <div className="text-gray-500">
                        Alerts
                    </div>

                    <div className="text-gray-500">
                        Settings
                    </div>

                </nav>

            </aside>

            {/* MAIN */}

            <main className="flex-1 p-8">

                {/* TOPBAR */}

                <div className="flex justify-between items-center mb-8">

                    <div>

                        <h2 className="text-3xl font-bold text-gray-800">
                            Fraud Analytics Overview
                        </h2>

                        <p className="text-gray-500 mt-1">
                            Monitoramento executivo antifraude
                        </p>

                    </div>

                    <button className="bg-blue-600 text-white px-5 py-3 rounded-xl shadow hover:bg-blue-700 transition">
                        Export Report
                    </button>

                </div>

                {/* KPI CARDS */}

                <div className="grid grid-cols-4 gap-6">

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

                        <p className="text-gray-500 text-sm">
                            Total Transactions
                        </p>

                        <h3 className="text-3xl font-bold text-gray-800 mt-3">
                            1.2M
                        </h3>

                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

                        <p className="text-gray-500 text-sm">
                            Total Frauds
                        </p>

                        <h3 className="text-3xl font-bold text-red-500 mt-3">
                            7,506
                        </h3>

                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

                        <p className="text-gray-500 text-sm">
                            Fraud Rate
                        </p>

                        <h3 className="text-3xl font-bold text-orange-500 mt-3">
                            0.57%
                        </h3>

                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

                        <p className="text-gray-500 text-sm">
                            Financial Volume
                        </p>

                        <h3 className="text-3xl font-bold text-green-600 mt-3">
                            $91M
                        </h3>

                    </div>

                </div>

                {/* CHART AREA */}

                <div className="grid grid-cols-2 gap-6 mt-8">

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-96">

                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Fraud by Hour
                        </h3>

                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-96">

                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Fraud by Category
                        </h3>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default App;