// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title HoneyChainRegistry
 * @dev Immutable honey traceability and provenance registry on Polygon Amoy Testnet.
 * Records hives, harvest batches, lab purity report hashes, and packaged units.
 */
contract HoneyChainRegistry {
    address public owner;

    struct HiveRecord {
        string hiveId;
        string beekeeperId;
        string colonyType;
        string locationHash;
        uint256 timestamp;
    }

    struct BatchRecord {
        string batchId;
        string stateCode;
        uint256 totalWeightGrams;
        string floralSource;
        uint256 hiveCount;
        bool isVerified;
        bytes32 labReportHash;
        string labVerdict;
        uint256 packCount;
        uint256 timestamp;
    }

    mapping(string => HiveRecord) public hives;
    mapping(string => BatchRecord) public batches;
    mapping(bytes32 => bool) public registeredReportHashes;

    event HiveRegistered(string indexed hiveId, string indexed beekeeperId, string colonyType, uint256 timestamp);
    event BatchCreated(string indexed batchId, string stateCode, uint256 totalWeightGrams, string floralSource, uint256 timestamp);
    event BatchVerified(string indexed batchId, bool passed, uint256 timestamp);
    event LabReportHashed(string indexed batchId, string indexed sampleId, bytes32 reportHash, string verdict, uint256 timestamp);
    event PackagingRecorded(string indexed batchId, uint256 packCount, uint256 jarSizeGrams, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can invoke");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerHive(
        string memory hiveId,
        string memory beekeeperId,
        string memory colonyType,
        string memory locationHash
    ) external onlyOwner {
        hives[hiveId] = HiveRecord({
            hiveId: hiveId,
            beekeeperId: beekeeperId,
            colonyType: colonyType,
            locationHash: locationHash,
            timestamp: block.timestamp
        });
        emit HiveRegistered(hiveId, beekeeperId, colonyType, block.timestamp);
    }

    function recordBatch(
        string memory batchId,
        string memory stateCode,
        uint256 totalWeightGrams,
        string memory floralSource,
        uint256 hiveCount
    ) external onlyOwner {
        batches[batchId] = BatchRecord({
            batchId: batchId,
            stateCode: stateCode,
            totalWeightGrams: totalWeightGrams,
            floralSource: floralSource,
            hiveCount: hiveCount,
            isVerified: false,
            labReportHash: bytes32(0),
            labVerdict: "",
            packCount: 0,
            timestamp: block.timestamp
        });
        emit BatchCreated(batchId, stateCode, totalWeightGrams, floralSource, block.timestamp);
    }

    function verifyBatch(string memory batchId, bool passed) external onlyOwner {
        require(bytes(batches[batchId].batchId).length > 0, "Batch does not exist");
        batches[batchId].isVerified = passed;
        emit BatchVerified(batchId, passed, block.timestamp);
    }

    function recordLabReport(
        string memory batchId,
        string memory sampleId,
        bytes32 reportHash,
        string memory verdict
    ) external onlyOwner {
        require(bytes(batches[batchId].batchId).length > 0, "Batch does not exist");
        batches[batchId].labReportHash = reportHash;
        batches[batchId].labVerdict = verdict;
        registeredReportHashes[reportHash] = true;
        emit LabReportHashed(batchId, sampleId, reportHash, verdict, block.timestamp);
    }

    function recordPackaging(
        string memory batchId,
        uint256 packCount,
        uint256 jarSizeGrams
    ) external onlyOwner {
        require(bytes(batches[batchId].batchId).length > 0, "Batch does not exist");
        batches[batchId].packCount = packCount;
        emit PackagingRecorded(batchId, packCount, jarSizeGrams, block.timestamp);
    }
}
