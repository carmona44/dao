import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
    VODKA_DAO_ABI,
    VODKA_DAO_CONTRACT_ADDRESS,
    BUENACHICA_NFT_ABI,
    BUENACHICA_NFT_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
    const [treasuryBalance, setTreasuryBalance] = useState("0");
    const [numProposals, setNumProposals] = useState("0");
    const [proposals, setProposals] = useState([]);
    const [nftBalance, setNftBalance] = useState(0);
    const [fakeNftTokenId, setFakeNftTokenId] = useState("");
    const [selectedTab, setSelectedTab] = useState("");
    const [loading, setLoading] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const web3ModalRef = useRef();

    const connectWallet = async () => {
        try {
            await getProviderOrSigner();
            setWalletConnected(true);
        } catch (error) {
            console.error(error);
        }
    };

    const getDAOTreasuryBalance = async () => {
        try {
            const provider = await getProviderOrSigner();
            const balance = await provider.getBalance(VODKA_DAO_CONTRACT_ADDRESS);
            setTreasuryBalance(balance.toString());
        } catch (error) {
            console.error(error);
        }
    };

    const getNumProposalsInDAO = async () => {
        try {
            const provider = await getProviderOrSigner();
            const contract = getDaoContractInstance(provider);
            const daoNumProposals = await contract.numProposals();
            setNumProposals(daoNumProposals.toString());
        } catch (error) {
            console.error(error);
        }
    };

    const getUserNFTBalance = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const nftContract = getBuenaChicaNFTContractInstance(signer);
            const balance = await nftContract.balanceOf(signer.getAddress());
            setNftBalance(parseInt(balance.toString()));
        } catch (error) {
            console.error(error);
        }
    };

    const createProposal = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const daoContract = getDaoContractInstance(signer);
            const txn = await daoContract.createProposal(fakeNftTokenId);
            setLoading(true);
            await txn.wait();
            await getNumProposalsInDAO();
            setLoading(false);
        } catch (error) {
            console.error(error);
            window.alert(error.data.message);
        }
    };

    const fetchProposalById = async (id) => {
        try {
            const provider = await getProviderOrSigner();
            const daoContract = getDaoContractInstance(provider);
            const proposal = await daoContract.proposals(id);
            const parsedProposal = {
                proposalId: id,
                nftTokenId: proposal.nftTokenId.toString(),
                deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
                yayVotes: proposal.yayVotes.toString(),
                nayVotes: proposal.nayVotes.toString(),
                executed: proposal.executed,
            };
            return parsedProposal;
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAllProposals = async () => {
        try {
            const proposals = [];
            for (let i = 0; i < numProposals; i++) {
                const proposal = await fetchProposalById(i);
                proposals.push(proposal);
            }
            setProposals(proposals);
            return proposals;
        } catch (error) {
            console.error(error);
        }
    };

    const voteOnProposal = async (proposalId, _vote) => {
        try {
            const signer = await getProviderOrSigner(true);
            const daoContract = getDaoContractInstance(signer);

            let vote = _vote === "YAY" ? 0 : 1;
            const txn = await daoContract.voteOnProposal(proposalId, vote);

            setLoading(true);
            await txn.wait();
            setLoading(false);
            await fetchAllProposals();
        } catch (error) {
            console.error(error);
            window.alert(error.data.message);
        }
    };

    const executeProposal = async (proposalId) => {
        try {
            const signer = await getProviderOrSigner(true);
            const daoContract = getDaoContractInstance(signer);
            const txn = await daoContract.executeProposal(proposalId);

            setLoading(true);
            await txn.wait();
            setLoading(false);
            await fetchAllProposals();
        } catch (error) {
            console.error(error);
            window.alert(error.data.message);
        }
    };

    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);

        const { chainId } = await web3Provider.getNetwork();
        if (chainId !== 5) {
            window.alert("Please switch to the Goerli network!");
            throw new Error("Please switch to the Goerli network");
        }

        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
    };

    const getDaoContractInstance = (providerOrSigner) => {
        return new Contract(VODKA_DAO_CONTRACT_ADDRESS, VODKA_DAO_ABI, providerOrSigner);
    };

    const getBuenaChicaNFTContractInstance = (providerOrSigner) => {
        return new Contract(BUENACHICA_NFT_CONTRACT_ADDRESS, BUENACHICA_NFT_ABI, providerOrSigner);
    };

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "goerli",
                providerOptions: {},
                disableInjectedProvider: false,
            });

            connectWallet().then(() => {
                getDAOTreasuryBalance();
                getUserNFTBalance();
                getNumProposalsInDAO();
            });
        }
    }, [walletConnected]);

    useEffect(() => {
        if (selectedTab === "View Proposals") {
            fetchAllProposals();
        }
    }, [selectedTab]);

    function renderTabs() {
        if (selectedTab === "Create Proposal") {
            return renderCreateProposalTab();
        } else if (selectedTab === "View Proposals") {
            return renderViewProposalsTab();
        }
        return null;
    }

    function renderCreateProposalTab() {
        if (loading) {
            return (
                <div className={styles.description}>
                    Cargando... Esperando a la transacción...
                </div>
            );
        } else if (nftBalance === 0) {
            return (
                <div className={styles.description}>
                    No tienes ningun NFT de BuenaChica. <br />
                    <b>No puedes crear ni votar ninguna propuesta</b>
                </div>
            );
        } else {
            return (
                <div className={styles.container}>
                    <label>Token ID del NFT falso a adquirir: </label>
                    <input
                        placeholder="0"
                        type="number"
                        onChange={(e) => setFakeNftTokenId(e.target.value)}
                    />
                    <button className={styles.button2} onClick={createProposal}>
                        Crear
                    </button>
                </div>
            );
        }
    }

    function renderViewProposalsTab() {
        if (loading) {
            return (
                <div className={styles.description}>
                    Cargando... Esperando a la transacción...
                </div>
            );
        } else if (proposals.length === 0) {
            return (
                <div className={styles.description}>No se ha creado ninguna propuesta</div>
            );
        } else {
            return (
                <div>
                    {proposals.map((p, index) => (
                        <div key={index} className={styles.proposalCard}>
                            <p>ID de la propuesta: {p.proposalId}</p>
                            <p>NFT falso a adquirir: {p.nftTokenId}</p>
                            <p>Fecha límite: {p.deadline.toLocaleString()}</p>
                            <p>Votos a favor: {p.yayVotes}</p>
                            <p>Votos en contra: {p.nayVotes}</p>
                            <p>¿Ejecutado?: {p.executed.toString()}</p>
                            {p.deadline.getTime() > Date.now() && !p.executed ? (
                                <div className={styles.flex}>
                                    <button
                                        className={styles.button2}
                                        onClick={() => voteOnProposal(p.proposalId, "YAY")}
                                    >
                                        Votar a favor
                                    </button>
                                    <button
                                        className={styles.button2}
                                        onClick={() => voteOnProposal(p.proposalId, "NAY")}
                                    >
                                        Votar en contra
                                    </button>
                                </div>
                            ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                                <div className={styles.flex}>
                                    <button
                                        className={styles.button2}
                                        onClick={() => executeProposal(p.proposalId)}
                                    >
                                        Ejecutar propuesta{" "}
                                        {p.yayVotes > p.nayVotes ? "(A favor)" : "(En contra)"}
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.description}>Propuesta ejecutada</div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    }

    return (
        <div>
            <Head>
                <title>voDkAO</title>
                <meta name="description" content="voDkAO" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>¡Bienvenido a voDkAO!</h1>
                    <div className={styles.description}>¡Bienvenido a la DAO de vodka jaj!</div>
                    <div className={styles.description}>
                        Tu balance de BuenaChica NFT: {nftBalance}
                        <br />
                        Balance de la tesorería de la DAO: {formatEther(treasuryBalance)} ETH
                        <br />
                        Número total de propuestas: {numProposals}
                    </div>
                    <div className={styles.flex}>
                        <button
                            className={styles.button}
                            onClick={() => setSelectedTab("Create Proposal")}
                        >
                            Crear propuesta
                        </button>
                        <button
                            className={styles.button}
                            onClick={() => setSelectedTab("View Proposals")}
                        >
                            Ver propuestas
                        </button>
                    </div>
                    {renderTabs()}
                </div>
                <div className={styles.picture}>
                    <img className={styles.image} src="/main.png" />
                </div>
            </div>

            <footer className={styles.footer}>
                Made with ❤️ by Carmona44
            </footer>
        </div>
    );
}