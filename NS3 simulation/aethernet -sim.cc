#include "ns3/core-module.h"
#include "ns3/network-module.h"
#include "ns3/internet-module.h"
#include "ns3/mobility-module.h"
#include "ns3/wifi-module.h"
#include "ns3/yans-wifi-helper.h"
#include "ns3/applications-module.h"
#include <unordered_set>
#include <vector>
#include <fstream>

using namespace ns3;

NS_LOG_COMPONENT_DEFINE("AetherNetEpidemicSim");

class EpidemicApp : public Application
{
public:
    EpidemicApp() : m_duplicateDrops(0), m_packetsReceived(0) {}
    virtual ~EpidemicApp() {}

    void Setup(Ptr<Socket> socket, Address address)
    {
        m_socket = socket;
        m_peerAddress = address;
    }

    uint32_t GetDuplicateDrops() const { return m_duplicateDrops; }
    uint32_t GetTotalReceived() const { return m_packetsReceived; }
    std::vector<double> GetLatencies() const { return m_latencies; }

private:
    virtual void StartApplication(void)
    {
        m_socket->Bind(InetSocketAddress(Ipv4Address::GetAny(), 80));
        m_socket->SetRecvCallback(MakeCallback(&EpidemicApp::ReceivePacket, this));
        m_socket->SetAllowBroadcast(true);
    }

    virtual void StopApplication(void)
    {
        if (m_socket)
            m_socket->Close();
    }

    void ReceivePacket(Ptr<Socket> socket)
    {
        Ptr<Packet> packet;
        Address from;
        while ((packet = socket->RecvFrom(from)))
        {
            m_packetsReceived++;

            uint32_t pktId = 0;
            packet->CopyData((uint8_t *)&pktId, 4);

            if (m_seenPackets.find(pktId) != m_seenPackets.end())
            {
                m_duplicateDrops++;
            }
            else
            {
                m_seenPackets.insert(pktId);

                double latency = Simulator::Now().GetSeconds() - 2.0;
                m_latencies.push_back(latency);

                Ptr<Packet> forwardPacket = packet->Copy();

                Simulator::Schedule(MilliSeconds(10), &EpidemicApp::BroadcastPacket, this, forwardPacket);
            }
        }
    }

    void BroadcastPacket(Ptr<Packet> packet)
    {
        m_socket->SendTo(packet, 0, m_peerAddress);
    }

    Ptr<Socket> m_socket;
    Address m_peerAddress;
    std::unordered_set<uint32_t> m_seenPackets;
    uint32_t m_duplicateDrops;
    uint32_t m_packetsReceived;
    std::vector<double> m_latencies;
};

int main(int argc, char *argv[])
{
    uint32_t nNodes = 100;
    double simTime = 100.0;

    CommandLine cmd;
    cmd.AddValue("nNodes", "", nNodes);
    cmd.Parse(argc, argv);

    NodeContainer nodes;
    nodes.Create(nNodes);

    WifiHelper wifi;
    wifi.SetStandard(WIFI_STANDARD_80211b);
    YansWifiPhyHelper wifiPhy;
    YansWifiChannelHelper wifiChannel = YansWifiChannelHelper::Default();
    wifiChannel.AddPropagationLoss("ns3::RangePropagationLossModel", "MaxRange", DoubleValue(65.0));
    wifiPhy.SetChannel(wifiChannel.Create());

    WifiMacHelper wifiMac;
    wifiMac.SetType("ns3::AdhocWifiMac");
    NetDeviceContainer devices = wifi.Install(wifiPhy, wifiMac, nodes);

    MobilityHelper mobility;
    mobility.SetPositionAllocator("ns3::RandomRectanglePositionAllocator",
                                  "X", StringValue("ns3::UniformRandomVariable[Min=0.0|Max=2000.0]"),
                                  "Y", StringValue("ns3::UniformRandomVariable[Min=0.0|Max=2000.0]"));
    mobility.SetMobilityModel("ns3::RandomWalk2dMobilityModel",
                              "Bounds", RectangleValue(Rectangle(0, 2000, 0, 2000)),
                              "Speed", StringValue("ns3::UniformRandomVariable[Min=1.0|Max=3.0]"));
    mobility.Install(nodes);

    InternetStackHelper internet;
    internet.Install(nodes);
    Ipv4AddressHelper ipv4;
    ipv4.SetBase("10.1.1.0", "255.255.255.0");
    Ipv4InterfaceContainer interfaces = ipv4.Assign(devices);

    InetSocketAddress broadcastAddr = InetSocketAddress(Ipv4Address("10.1.1.255"), 80);

    std::vector<Ptr<EpidemicApp>> apps;
    for (uint32_t i = 0; i < nNodes; ++i)
    {
        Ptr<Socket> recvSink = Socket::CreateSocket(nodes.Get(i), TypeId::LookupByName("ns3::UdpSocketFactory"));
        Ptr<EpidemicApp> app = CreateObject<EpidemicApp>();
        app->Setup(recvSink, broadcastAddr);
        nodes.Get(i)->AddApplication(app);
        app->SetStartTime(Seconds(1.0));
        app->SetStopTime(Seconds(simTime));
        apps.push_back(app);
    }

    uint32_t sosPacketId = 9999;
    uint8_t payloadBuffer[240] = {0};
    memcpy(payloadBuffer, &sosPacketId, sizeof(sosPacketId));
    Ptr<Packet> initialPacket = Create<Packet>(payloadBuffer, 240);

    Ptr<Socket> source = Socket::CreateSocket(nodes.Get(0), TypeId::LookupByName("ns3::UdpSocketFactory"));
    Simulator::Schedule(Seconds(2.0), &Socket::SendTo, source, initialPacket, 0, broadcastAddr);

    Simulator::Stop(Seconds(simTime));
    Simulator::Run();

    uint32_t totalDropped = 0, totalReceived = 0, nodesWithPacket = 0;
    std::vector<double> allLatencies;

    for (auto app : apps)
    {
        totalDropped += app->GetDuplicateDrops();
        totalReceived += app->GetTotalReceived();
        if ((app->GetTotalReceived() - app->GetDuplicateDrops()) > 0)
            nodesWithPacket++;
        for (double lat : app->GetLatencies())
        {
            allLatencies.push_back(lat);
        }
    }

    std::cout << "Nodes: " << nNodes
              << ", PDR: " << (double)nodesWithPacket / nNodes * 100 << "%"
              << ", Total RX: " << totalReceived
              << ", Duplicates Dropped: " << totalDropped << std::endl;

    std::ofstream outFile("latency_results.csv", std::ios_base::app);
    for (double lat : allLatencies)
    {
        outFile << nNodes << "," << lat << "\n";
    }
    outFile.close();

    Simulator::Destroy();
    return 0;
}