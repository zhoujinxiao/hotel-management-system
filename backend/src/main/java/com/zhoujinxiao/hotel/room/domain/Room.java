package com.zhoujinxiao.hotel.room.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "room")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(name = "room_number", nullable = false, unique = true, length = 20)
    private String roomNumber;

    @Column(name = "floor_number", nullable = false)
    private int floorNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "occupancy_status", nullable = false, length = 20)
    private OccupancyStatus occupancyStatus = OccupancyStatus.VACANT;

    @Enumerated(EnumType.STRING)
    @Column(name = "cleanliness_status", nullable = false, length = 20)
    private CleanlinessStatus cleanlinessStatus = CleanlinessStatus.DIRTY;

    @Enumerated(EnumType.STRING)
    @Column(name = "usability_status", nullable = false, length = 20)
    private UsabilityStatus usabilityStatus = UsabilityStatus.USABLE;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Room() {
    }

    public static Room create(RoomType roomType, String roomNumber, int floorNumber, String notes) {
        if (roomType == null) throw new IllegalArgumentException("房型不能为空");
        if (roomNumber == null || roomNumber.isBlank()) throw new IllegalArgumentException("房号不能为空");
        if (floorNumber <= 0) throw new IllegalArgumentException("楼层必须大于 0");
        Room room = new Room();
        room.roomType = roomType;
        room.roomNumber = roomNumber.trim().toUpperCase();
        room.floorNumber = floorNumber;
        room.notes = notes == null ? null : notes.trim();
        return room;
    }

    public void updateStatus(OccupancyStatus occupancyStatus, CleanlinessStatus cleanlinessStatus, UsabilityStatus usabilityStatus) {
        if (occupancyStatus == null && cleanlinessStatus == null && usabilityStatus == null) {
            throw new IllegalArgumentException("至少需要提供一个房态字段");
        }
        if (occupancyStatus != null) this.occupancyStatus = occupancyStatus;
        if (cleanlinessStatus != null) this.cleanlinessStatus = cleanlinessStatus;
        if (usabilityStatus != null) this.usabilityStatus = usabilityStatus;
    }

    public Long getId() { return id; }
    public RoomType getRoomType() { return roomType; }
    public String getRoomNumber() { return roomNumber; }
    public int getFloorNumber() { return floorNumber; }
    public OccupancyStatus getOccupancyStatus() { return occupancyStatus; }
    public CleanlinessStatus getCleanlinessStatus() { return cleanlinessStatus; }
    public UsabilityStatus getUsabilityStatus() { return usabilityStatus; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
